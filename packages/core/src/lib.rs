use wasm_bindgen::prelude::*;
pub mod ast;
pub mod formula_parser;
pub mod parser;
pub mod evaluator;

#[wasm_bindgen]
pub fn calcmd(markdown: &str) -> String {
    let mut p = parser::Parser::new();
    let parsed_table = p.parse(markdown);
    
    let mut eval = evaluator::Evaluator::new();
    let evaluated_table = eval.evaluate(parsed_table);
    
    serde_json::to_string(&evaluated_table).unwrap_or_else(|_| "{}".to_string())
}
