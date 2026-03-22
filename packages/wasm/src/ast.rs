use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Primitive value types equivalent to TS CellValue: number | string | boolean | null
/// Note: Error value is internal during evaluation, but we usually return a Result.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum CellValue {
    Number(f64),
    String(String),
    Boolean(bool),
    Null,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cell {
    pub value: CellValue,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formula: Option<String>,
    #[serde(rename = "effectiveFormula", skip_serializing_if = "Option::is_none")]
    pub effective_formula: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub computed: Option<CellValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bold: Option<bool>,
    #[serde(rename = "isColumnFormula", skip_serializing_if = "Option::is_none")]
    pub is_column_formula: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Column {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formula: Option<String>,
    pub cells: Vec<Cell>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Row {
    pub cells: Vec<Cell>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelLocation {
    pub row: usize,
    pub col: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Table {
    pub columns: Vec<Column>,
    pub rows: Vec<Row>,
    pub labels: HashMap<String, LabelLocation>,
    pub aliases: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedTable {
    pub table: Table,
    pub dependencies: DependencyGraph,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DependencyGraph {
    pub nodes: HashMap<String, CellNode>,
    pub edges: HashMap<String, HashSet<String>>,
    pub order: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellNode {
    pub id: String,
    pub row: usize,
    pub col: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formula: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    #[serde(rename = "type")]
    pub error_type: String, // 'parse' | 'validation' | 'runtime'
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<String>,
    pub message: String,
}

// AST Nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Expression {
    #[serde(rename = "literal")]
    Literal { value: CellValue },
    
    #[serde(rename = "column")]
    ColumnRef { name: String },
    
    #[serde(rename = "label")]
    LabelRef { label: String },
    
    #[serde(rename = "binary")]
    Binary {
        operator: String,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    
    #[serde(rename = "unary")]
    Unary {
        operator: String,
        operand: Box<Expression>,
    },
    
    #[serde(rename = "function")]
    FunctionCall {
        name: String,
        args: Vec<Expression>,
    },
    
    #[serde(rename = "paren")]
    Paren { expression: Box<Expression> },
}
