use pest::Parser;
use pest::iterators::Pair;
use pest_derive::Parser;
use crate::ast::{Expression, CellValue};

#[derive(Parser)]
#[grammar = "formula.pest"]
pub struct CalcMdFormulaParser;

pub fn parse(formula: &str) -> Result<Expression, String> {
    let mut pairs = CalcMdFormulaParser::parse(Rule::formula, formula)
        .map_err(|e| format!("Formula error: {}", e))?;
        
    let expr_pair = pairs.next().ok_or("Empty formula")?;
    Ok(parse_expr(expr_pair))
}

fn parse_expr(pair: Pair<Rule>) -> Expression {
    match pair.as_rule() {
        Rule::expr_or | Rule::expr_and | Rule::expr_comp | Rule::expr_add | Rule::expr_mul => {
            let mut inner = pair.into_inner();
            let mut left = parse_expr(inner.next().unwrap());
            
            while let Some(op) = inner.next() {
                let right = parse_expr(inner.next().unwrap());
                left = Expression::Binary {
                    operator: op.as_str().to_string(),
                    left: Box::new(left),
                    right: Box::new(right),
                };
            }
            left
        }
        Rule::unary => {
            let mut inner = pair.into_inner();
            let op = inner.next().unwrap().as_str().to_string();
            let operand = parse_expr(inner.next().unwrap());
            Expression::Unary {
                operator: op,
                operand: Box::new(operand),
            }
        }
        Rule::function => {
            let mut inner = pair.into_inner();
            let name = inner.next().unwrap().as_str().to_string();
            let mut args = Vec::new();
            for arg_pair in inner {
                args.push(parse_expr(arg_pair));
            }
            Expression::FunctionCall { name, args }
        }
        Rule::paren => {
            let inner = pair.into_inner().next().unwrap();
            Expression::Paren {
                expression: Box::new(parse_expr(inner)),
            }
        }
        Rule::ident => Expression::ColumnRef {
            name: pair.as_str().to_string(),
        },
        Rule::label => Expression::LabelRef {
            // strip the '@' prefix
            label: pair.as_str()[1..].to_string(),
        },
        Rule::number => {
            let val: f64 = pair.as_str().parse().unwrap();
            Expression::Literal { value: CellValue::Number(val) }
        }
        Rule::boolean => {
            let val = pair.as_str().eq_ignore_ascii_case("true");
            Expression::Literal { value: CellValue::Boolean(val) }
        }
        Rule::string => {
            // String rule captures the whole thing including quotes
            let s = pair.as_str();
            // Remove surrounding quotes
            let content = if s.len() >= 2 {
                &s[1..s.len()-1]
            } else {
                s
            };
            Expression::Literal { value: CellValue::String(content.to_string()) }
        }
        _ => unreachable!("Unknown rule: {:?}", pair.as_rule()),
    }
}
