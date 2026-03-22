use crate::ast::{CellNode, CellValue, DependencyGraph, Expression, ParsedTable, ValidationError};
use crate::formula_parser;
use petgraph::algo::tarjan_scc;
use petgraph::graph::DiGraph;
use std::collections::{HashMap, HashSet};

pub struct Evaluator {
    errors: Vec<ValidationError>,
}

struct EvalContext<'a> {
    table: &'a ParsedTable,
    columns: &'a HashMap<String, usize>,
    aliases: &'a HashMap<String, String>,
    row_index: usize,
    col_index: usize,
}

impl Evaluator {
    pub fn new() -> Self {
        Self { errors: Vec::new() }
    }

    pub fn evaluate(&mut self, mut parsed_table: ParsedTable) -> ParsedTable {
        self.errors.clear();
        self.expand(&mut parsed_table);
        self.build_dependency_graph(&mut parsed_table);
        self.compute_in_order(&mut parsed_table);
        
        parsed_table.errors.extend(self.errors.clone());
        parsed_table
    }

    fn expand(&mut self, table: &mut ParsedTable) {
        for row in &mut table.table.rows {
            for (col_idx, col) in table.table.columns.iter().enumerate() {
                let cell = &mut row.cells[col_idx];
                if let Some(f) = &cell.formula {
                    cell.effective_formula = Some(f.clone());
                    cell.is_column_formula = Some(false);
                } else if let Some(f) = &col.formula {
                    cell.effective_formula = Some(f.clone());
                    cell.is_column_formula = Some(true);
                }
            }
        }
    }

    fn cell_id(row: usize, col: usize) -> String {
        format!("R{}.C{}", row, col)
    }

    fn build_dependency_graph(&mut self, p_table: &mut ParsedTable) {
        let mut col_lower = HashMap::new();
        for (idx, col) in p_table.table.columns.iter().enumerate() {
            col_lower.insert(col.name.to_lowercase(), idx);
            if let Some(alias) = &col.alias {
                col_lower.insert(alias.to_lowercase(), idx);
            }
            let normalized = col.name.replace(char::is_whitespace, "_").to_lowercase();
            col_lower.entry(normalized).or_insert(idx);
        }

        let resolve_col = |name: &str| -> Option<usize> {
            col_lower.get(&name.to_lowercase()).copied()
        };

        let mut nodes = HashMap::new();
        let mut edges_map: HashMap<String, HashSet<String>> = HashMap::new();

        for (row_idx, row) in p_table.table.rows.iter().enumerate() {
            for col_idx in 0..p_table.table.columns.len() {
                let cell = &row.cells[col_idx];
                if let Some(formula) = &cell.effective_formula {
                    let id = Self::cell_id(row_idx, col_idx);
                    nodes.insert(id.clone(), CellNode {
                        id: id.clone(),
                        row: row_idx,
                        col: col_idx,
                        formula: Some(formula.clone()),
                    });
                    edges_map.entry(id.clone()).or_insert_with(HashSet::new);

                    match formula_parser::parse(formula) {
                        Ok(ast) => {
                            self.collect_deps(&ast, row_idx, col_idx, p_table, &resolve_col, &id, &mut edges_map);
                        }
                        Err(e) => {
                            self.add_error("parse", Some(row_idx), Some(p_table.table.columns[col_idx].name.clone()), e);
                        }
                    }
                }
            }
        }

        // Build petgraph for tarjan_scc
        let mut graph = DiGraph::<String, ()>::new();
        let mut node_indices = HashMap::new();

        for id in nodes.keys() {
            let idx = graph.add_node(id.clone());
            node_indices.insert(id.clone(), idx);
        }

        for (from_id, deps) in &edges_map {
            if let Some(&from_idx) = node_indices.get(from_id) {
                for dep in deps {
                    // if dep is not a node with a formula, it might be a static cell.
                    // tarjan_scc doesn't care if a node is leaf. But DiGraph needs the node to exist.
                    let dep_idx = *node_indices.entry(dep.clone()).or_insert_with(|| graph.add_node(dep.clone()));
                    // Error: from depends on dep. Topological sort evaluates deps first.
                    // To get deps first in tarjan_scc, edges should go from dep to from_id.
                    graph.add_edge(dep_idx, from_idx, ());
                }
            }
        }

        let mut sccs = tarjan_scc(&graph);
        sccs.reverse();
        let mut order = Vec::new();
        let mut cycle_nodes = HashSet::new();

        for scc in sccs {
            if scc.len() > 1 {
                // Cycle among multiple nodes
                let cycle_path: Vec<String> = scc.iter().map(|idx| graph[*idx].clone()).collect();
                for id in &cycle_path {
                    cycle_nodes.insert(id.clone());
                }
                let path_str = cycle_path.join(" → ");
                self.add_error("runtime", None, None, format!("Circular dependency: {}", path_str));
            } else if scc.len() == 1 {
                let node_idx = scc[0];
                let is_self_loop = graph.edges_directed(node_idx, petgraph::Direction::Outgoing)
                    .any(|edge| petgraph::visit::EdgeRef::target(&edge) == node_idx);
                let id = graph[node_idx].clone();
                if is_self_loop {
                    cycle_nodes.insert(id.clone());
                    self.add_error("runtime", None, None, format!("Circular dependency: {} → {}", id, id));
                } else if nodes.contains_key(&id) {
                    order.push(id);
                }
            }
        }

        p_table.dependencies = DependencyGraph {
            nodes,
            edges: edges_map,
            order,
        };

        // Mark errors on cycle nodes explicitly
        for id in &cycle_nodes {
            if let Some(node) = p_table.dependencies.nodes.get(id) {
                let cell = &mut p_table.table.rows[node.row].cells[node.col];
                cell.error = Some("Circular dependency".to_string());
                self.add_error("runtime", Some(node.row), Some(p_table.table.columns[node.col].name.clone()), "Circular dependency".to_string());
            }
        }
    }

    fn collect_deps<F>(
        &self,
        expr: &Expression,
        row_idx: usize,
        col_idx: usize,
        table: &ParsedTable,
        resolve_col: &F,
        from_id: &str,
        edges: &mut HashMap<String, HashSet<String>>,
    ) where
        F: Fn(&str) -> Option<usize>,
    {
        match expr {
            Expression::ColumnRef { name } => {
                if let Some(ci) = resolve_col(name) {
                    let dep_id = Self::cell_id(row_idx, ci);
                    if dep_id != from_id {
                        edges.entry(from_id.to_string()).or_default().insert(dep_id);
                    }
                }
            }
            Expression::LabelRef { label } => {
                if let Some(loc) = table.table.labels.get(label) {
                    edges.entry(from_id.to_string()).or_default().insert(Self::cell_id(loc.row, loc.col));
                }
            }
            Expression::FunctionCall { name, args } => {
                let lower_name = name.to_lowercase();
                let agg_fns = ["sum", "avg", "average", "count", "min", "max"];
                if agg_fns.contains(&lower_name.as_str()) && args.len() == 1 {
                    if let Expression::ColumnRef { name: col_name } = &args[0] {
                        if let Some(ci) = resolve_col(col_name) {
                            let is_column_formula = table.table.rows[row_idx].cells[col_idx].is_column_formula.unwrap_or(false);
                            if is_column_formula {
                                for ri in 0..table.table.rows.len() {
                                    edges.entry(from_id.to_string()).or_default().insert(Self::cell_id(ri, ci));
                                }
                            } else {
                                for ri in 0..row_idx {
                                    edges.entry(from_id.to_string()).or_default().insert(Self::cell_id(ri, ci));
                                }
                            }
                            return;
                        }
                    }
                }
                for arg in args {
                    self.collect_deps(arg, row_idx, col_idx, table, resolve_col, from_id, edges);
                }
            }
            Expression::Binary { left, right, .. } => {
                self.collect_deps(left, row_idx, col_idx, table, resolve_col, from_id, edges);
                self.collect_deps(right, row_idx, col_idx, table, resolve_col, from_id, edges);
            }
            Expression::Unary { operand, .. } => {
                self.collect_deps(operand, row_idx, col_idx, table, resolve_col, from_id, edges);
            }
            Expression::Paren { expression } => {
                self.collect_deps(expression, row_idx, col_idx, table, resolve_col, from_id, edges);
            }
            Expression::Literal { .. } => {}
        }
    }

    fn compute_in_order(&mut self, table: &mut ParsedTable) {
        let mut columns = HashMap::new();
        let mut aliases = HashMap::new();
        
        for (i, col) in table.table.columns.iter().enumerate() {
            columns.insert(col.name.clone(), i);
            if let Some(alias) = &col.alias {
                aliases.insert(alias.to_lowercase(), col.name.clone());
            }
            let normalized = col.name.replace(char::is_whitespace, "_");
            if normalized != col.name {
                columns.insert(normalized, i);
            }
        }

        let order = table.dependencies.order.clone();
        for id in order {
            if let Some(node) = table.dependencies.nodes.get(&id) {
                if let Some(formula) = &node.formula {
                    let mut cell_computed = None;
                    let mut cell_error = None;
                    
                    match formula_parser::parse(formula) {
                        Ok(ast) => {
                            let ctx = EvalContext {
                                table,
                                columns: &columns,
                                aliases: &aliases,
                                row_index: node.row,
                                col_index: node.col,
                            };
                            match self.evaluate_expression(&ast, &ctx) {
                                Ok(val) => cell_computed = Some(val),
                                Err(msg) => {
                                    cell_error = Some(msg.clone());
                                    self.add_error("runtime", Some(node.row), Some(table.table.columns[node.col].name.clone()), msg);
                                }
                            }
                        }
                        Err(e) => {
                            cell_error = Some(e);
                        }
                    }

                    let row = &mut table.table.rows[node.row];
                    let cell = &mut row.cells[node.col];
                    cell.computed = cell_computed;
                    if cell_error.is_some() {
                        cell.error = cell_error;
                    }
                }
            }
        }
    }

    fn resolve_col_index(&self, name: &str, ctx: &EvalContext) -> Result<usize, String> {
        let lower_name = name.to_lowercase();
        if let Some(target) = ctx.aliases.get(&lower_name) {
            if let Some(idx) = ctx.table.table.columns.iter().position(|c| c.name.eq_ignore_ascii_case(target)) {
                return Ok(idx);
            }
        }
        if let Some(idx) = ctx.table.table.columns.iter().position(|c| {
            c.name.eq_ignore_ascii_case(&lower_name) ||
            c.name.replace(char::is_whitespace, "_").eq_ignore_ascii_case(&lower_name) ||
            c.alias.as_ref().map(|a| a.eq_ignore_ascii_case(&lower_name)).unwrap_or(false)
        }) {
            return Ok(idx);
        }
        
        Err(format!("Column '{}' not found", name))
    }

    fn evaluate_expression(&self, expr: &Expression, ctx: &EvalContext) -> Result<CellValue, String> {
        match expr {
            Expression::Literal { value } => Ok(value.clone()),
            Expression::ColumnRef { name } => {
                let idx = self.resolve_col_index(name, ctx)?;
                let cell = &ctx.table.table.rows[ctx.row_index].cells[idx];
                Ok(cell.computed.clone().unwrap_or(cell.value.clone()))
            }
            Expression::LabelRef { label } => {
                let loc = ctx.table.table.labels.get(label).ok_or_else(|| format!("Label '@{}' not found", label))?;
                let cell = &ctx.table.table.rows[loc.row].cells[loc.col];
                Ok(cell.computed.clone().unwrap_or(cell.value.clone()))
            }
            Expression::Binary { operator, left, right } => {
                let left_val = self.evaluate_expression(left, ctx)?;
                let right_val = self.evaluate_expression(right, ctx)?;

                if let (CellValue::Null, _) | (_, CellValue::Null) = (&left_val, &right_val) {
                    if operator == "==" { return Ok(CellValue::Boolean(left_val == right_val)); }
                    if operator == "!=" { return Ok(CellValue::Boolean(left_val != right_val)); }
                    return Ok(CellValue::Null);
                }

                match operator.as_str() {
                    "+" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => Ok(CellValue::Number(l + r)),
                        (CellValue::String(l), CellValue::String(r)) => Ok(CellValue::String(format!("{}{}", l, r))),
                        (l, r) => Err(format!("Cannot add {:?} and {:?}", l, r)),
                    },
                    "-" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => Ok(CellValue::Number(l - r)),
                        (l, r) => Err(format!("Cannot subtract {:?} and {:?}", l, r)),
                    },
                    "*" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => Ok(CellValue::Number(l * r)),
                        (l, r) => Err(format!("Cannot multiply {:?} and {:?}", l, r)),
                    },
                    "/" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => {
                            if r == 0.0 { return Err("Division by zero".to_string()); }
                            Ok(CellValue::Number(l / r))
                        }
                        (l, r) => Err(format!("Cannot divide {:?} by {:?}", l, r)),
                    },
                    "%" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => Ok(CellValue::Number(l % r)),
                        (l, r) => Err(format!("Cannot modulo {:?} by {:?}", l, r)),
                    },
                    "==" => Ok(CellValue::Boolean(left_val == right_val)),
                    "!=" => Ok(CellValue::Boolean(left_val != right_val)),
                    ">" | "<" | ">=" | "<=" => match (left_val, right_val) {
                        (CellValue::Number(l), CellValue::Number(r)) => {
                            Ok(CellValue::Boolean(match operator.as_str() {
                                ">" => l > r, "<" => l < r, ">=" => l >= r, _ => l <= r
                            }))
                        }
                        (CellValue::String(l), CellValue::String(r)) => {
                            Ok(CellValue::Boolean(match operator.as_str() {
                                ">" => l > r, "<" => l < r, ">=" => l >= r, _ => l <= r
                            }))
                        }
                        _ => Err(format!("Cannot compare values with '{}'", operator))
                    },
                    "and" | "or" => {
                        let l_bool = match left_val { CellValue::Boolean(b) => b, _ => left_val != CellValue::Null };
                        let r_bool = match right_val { CellValue::Boolean(b) => b, _ => right_val != CellValue::Null };
                        if operator == "and" { Ok(CellValue::Boolean(l_bool && r_bool)) }
                        else { Ok(CellValue::Boolean(l_bool || r_bool)) }
                    }
                    _ => Err(format!("Unknown operator: {}", operator)),
                }
            }
            Expression::Unary { operator, operand } => {
                let val = self.evaluate_expression(operand, ctx)?;
                match operator.as_str() {
                    "-" => match val {
                        CellValue::Number(n) => Ok(CellValue::Number(-n)),
                        _ => Err(format!("Cannot negate {:?}", val)),
                    },
                    "not" => match val {
                        CellValue::Boolean(b) => Ok(CellValue::Boolean(!b)),
                        CellValue::Null => Ok(CellValue::Boolean(true)),
                        _ => Ok(CellValue::Boolean(false)),
                    },
                    _ => Err(format!("Unknown unary operator: {}", operator)),
                }
            }
            Expression::FunctionCall { name, args } => {
                match name.to_lowercase().as_str() {
                    "sum" => self.func_sum(args, ctx),
                    "avg" | "average" => self.func_avg(args, ctx),
                    "count" => self.func_count(args, ctx),
                    "min" => self.func_min(args, ctx),
                    "max" => self.func_max(args, ctx),
                    "round" => self.func_round(args, ctx),
                    "abs" => self.func_abs(args, ctx),
                    "floor" => self.func_floor(args, ctx),
                    "ceil" => self.func_ceil(args, ctx),
                    "if" => self.func_if(args, ctx),
                    _ => Err(format!("Unknown function: {}", name)),
                }
            }
            Expression::Paren { expression } => self.evaluate_expression(expression, ctx),
        }
    }

    fn get_column_values(&self, col_name: &str, ctx: &EvalContext) -> Result<Vec<CellValue>, String> {
        let idx = self.resolve_col_index(col_name, ctx)?;
        let current_cell = &ctx.table.table.rows[ctx.row_index].cells[ctx.col_index];
        let is_column_formula = current_cell.is_column_formula.unwrap_or(false);

        let end_row = if is_column_formula { ctx.table.table.rows.len() } else { ctx.row_index };

        let mut values = Vec::new();
        for ri in 0..end_row {
            let cell = &ctx.table.table.rows[ri].cells[idx];
            values.push(cell.computed.clone().unwrap_or(cell.value.clone()));
        }
        Ok(values)
    }

    fn func_sum(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("SUM requires exactly 1 argument".to_string()); }
        if let Expression::ColumnRef { name } = &args[0] {
            let values = self.get_column_values(name, ctx)?;
            let sum = values.into_iter().fold(0.0, |acc, v| {
                if let CellValue::Number(n) = v { acc + n } else { acc }
            });
            Ok(CellValue::Number(sum))
        } else {
            Err("SUM argument must be a column name".to_string())
        }
    }

    fn func_avg(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("AVG requires exactly 1 argument".to_string()); }
        if let Expression::ColumnRef { name } = &args[0] {
            let values = self.get_column_values(name, ctx)?;
            let nums: Vec<f64> = values.into_iter().filter_map(|v| if let CellValue::Number(n) = v { Some(n) } else { None }).collect();
            if nums.is_empty() { return Ok(CellValue::Number(0.0)); }
            let sum: f64 = nums.iter().sum();
            Ok(CellValue::Number(sum / nums.len() as f64))
        } else {
            Err("AVG argument must be a column name".to_string())
        }
    }

    fn func_count(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("COUNT requires exactly 1 argument".to_string()); }
        if let Expression::ColumnRef { name } = &args[0] {
            let values = self.get_column_values(name, ctx)?;
            let count = values.into_iter().filter(|v| v != &CellValue::Null).count();
            Ok(CellValue::Number(count as f64))
        } else {
            Err("COUNT argument must be a column name".to_string())
        }
    }

    fn func_min(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("MIN requires exactly 1 argument".to_string()); }
        if let Expression::ColumnRef { name } = &args[0] {
            let values = self.get_column_values(name, ctx)?;
            let nums: Vec<f64> = values.into_iter().filter_map(|v| if let CellValue::Number(n) = v { Some(n) } else { None }).collect();
            if nums.is_empty() { return Err("No numeric values in column".to_string()); }
            let min = nums.into_iter().fold(f64::INFINITY, f64::min);
            Ok(CellValue::Number(min))
        } else {
            Err("MIN argument must be a column name".to_string())
        }
    }

    fn func_max(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("MAX requires exactly 1 argument".to_string()); }
        if let Expression::ColumnRef { name } = &args[0] {
            let values = self.get_column_values(name, ctx)?;
            let nums: Vec<f64> = values.into_iter().filter_map(|v| if let CellValue::Number(n) = v { Some(n) } else { None }).collect();
            if nums.is_empty() { return Err("No numeric values in column".to_string()); }
            let max = nums.into_iter().fold(f64::NEG_INFINITY, f64::max);
            Ok(CellValue::Number(max))
        } else {
            Err("MAX argument must be a column name".to_string())
        }
    }

    fn func_round(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.is_empty() || args.len() > 2 { return Err("ROUND requires 1 or 2 arguments".to_string()); }
        let val = self.evaluate_expression(&args[0], ctx)?;
        if let CellValue::Number(value) = val {
            let decimals = if args.len() == 2 {
                if let CellValue::Number(d) = self.evaluate_expression(&args[1], ctx)? { d } else { return Err("ROUND second argument must be a number".to_string()); }
            } else { 0.0 };
            let factor = 10f64.powf(decimals);
            Ok(CellValue::Number((value * factor).round() / factor))
        } else {
            Err("ROUND first argument must be a number".to_string())
        }
    }

    fn func_abs(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("ABS requires exactly 1 argument".to_string()); }
        if let CellValue::Number(val) = self.evaluate_expression(&args[0], ctx)? {
            Ok(CellValue::Number(val.abs()))
        } else {
            Err("ABS argument must be a number".to_string())
        }
    }

    fn func_floor(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("FLOOR requires exactly 1 argument".to_string()); }
        if let CellValue::Number(val) = self.evaluate_expression(&args[0], ctx)? {
            Ok(CellValue::Number(val.floor()))
        } else {
            Err("FLOOR argument must be a number".to_string())
        }
    }

    fn func_ceil(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 1 { return Err("CEIL requires exactly 1 argument".to_string()); }
        if let CellValue::Number(val) = self.evaluate_expression(&args[0], ctx)? {
            Ok(CellValue::Number(val.ceil()))
        } else {
            Err("CEIL argument must be a number".to_string())
        }
    }

    fn func_if(&self, args: &[Expression], ctx: &EvalContext) -> Result<CellValue, String> {
        if args.len() != 3 { return Err("IF requires exactly 3 arguments".to_string()); }
        let cond = self.evaluate_expression(&args[0], ctx)?;
        let condition_met = match cond {
            CellValue::Boolean(b) => b,
            CellValue::Null => false,
            _ => true,
        };
        if condition_met {
            self.evaluate_expression(&args[1], ctx)
        } else {
            self.evaluate_expression(&args[2], ctx)
        }
    }

    fn add_error(&mut self, err_type: &str, row: Option<usize>, column: Option<String>, message: String) {
        self.errors.push(ValidationError {
            error_type: err_type.to_string(),
            row,
            column,
            message,
        });
    }
}
