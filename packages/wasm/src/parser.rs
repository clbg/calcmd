use crate::ast::{Cell, CellValue, Column, DependencyGraph, LabelLocation, ParsedTable, Row, Table, ValidationError};
use std::collections::HashMap;

pub struct Parser {
    errors: Vec<ValidationError>,
}

impl Parser {
    pub fn new() -> Self {
        Parser { errors: Vec::new() }
    }

    pub fn parse(&mut self, markdown: &str) -> ParsedTable {
        self.errors.clear();
        
        let lines: Vec<&str> = markdown.trim().lines().collect();
        if lines.len() < 2 {
            self.errors.push(ValidationError {
                error_type: "parse".to_string(),
                row: None,
                column: None,
                message: "Table must have at least header and separator rows".to_string(),
            });
            return self.empty_table();
        }

        let header_line = lines[0];
        let columns = self.parse_header(header_line);
        
        let mut aliases = HashMap::new();
        for col in &columns {
            if let Some(alias) = &col.alias {
                let alias_lower = alias.to_lowercase();
                if aliases.contains_key(&alias_lower) {
                    self.errors.push(ValidationError {
                        error_type: "parse".to_string(),
                        row: None,
                        column: Some(col.name.clone()),
                        message: format!("Duplicate column alias '#{}'", alias),
                    });
                } else {
                    aliases.insert(alias_lower, col.name.clone());
                }
            }
        }
        
        let mut rows = Vec::new();
        for i in 2..lines.len() {
            let row_line = lines[i].trim();
            if row_line.is_empty() {
                continue;
            }
            if let Some(row) = self.parse_row(row_line, columns.len()) {
                rows.push(row);
            }
        }
        
        let mut labels = HashMap::new();
        
        for (row_index, row) in rows.iter_mut().enumerate() {
            for (col_index, cell) in row.cells.iter_mut().enumerate() {
                if let CellValue::String(s) = &cell.value {
                    if let Some((label, value_str)) = Self::extract_label(s) {
                        cell.label = Some(label.clone());
                        cell.value = Self::parse_value(&value_str);
                        
                        if labels.contains_key(&label) {
                            let col_name = columns.get(col_index).map(|c| c.name.clone());
                            self.errors.push(ValidationError {
                                error_type: "parse".to_string(),
                                row: Some(row_index),
                                column: col_name,
                                message: format!("Duplicate label '@{}'", label),
                            });
                        } else {
                            labels.insert(label, LabelLocation { row: row_index, col: col_index });
                        }
                    }
                }
            }
        }

        ParsedTable {
            table: Table {
                columns,
                rows,
                labels,
                aliases,
            },
            dependencies: DependencyGraph::default(),
            errors: self.errors.clone(),
        }
    }

    fn extract_label(raw: &str) -> Option<(String, String)> {
        let trimmed = raw.trim();
        if !trimmed.starts_with('@') {
            return None;
        }
        if let Some(colon_idx) = trimmed.find(':') {
            if colon_idx > 1 {
                let label = trimmed[1..colon_idx].trim();
                if Self::is_valid_ident(label) {
                    let value = trimmed[colon_idx + 1..].trim();
                    return Some((label.to_string(), value.to_string()));
                }
            }
        }
        let bare = trimmed[1..].trim();
        if Self::is_valid_ident(bare) {
            return Some((bare.to_string(), trimmed.to_string()));
        }
        None
    }

    fn is_valid_ident(s: &str) -> bool {
        if s.is_empty() { return false; }
        let mut chars = s.chars();
        let first = chars.next().unwrap();
        if !(first.is_ascii_alphabetic() || first == '_') {
            return false;
        }
        chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
    }

    fn parse_header(&mut self, line: &str) -> Vec<Column> {
        self.split_row(line).into_iter().map(|cell_str| {
            let mut trimmed = cell_str.trim();
            let mut formula = None;
            
            if let Some(equals_idx) = trimmed.find('=') {
                if equals_idx > 0 {
                    formula = Some(trimmed[equals_idx + 1..].trim().to_string());
                    trimmed = trimmed[..equals_idx].trim();
                }
            }
            
            let mut alias = None;
            if let Some(hash_idx) = trimmed.rfind(" #") {
                let potential_alias = trimmed[hash_idx + 2..].trim();
                if Self::is_valid_ident(potential_alias) {
                    alias = Some(potential_alias.to_string());
                    trimmed = trimmed[..hash_idx].trim();
                }
            }
            
            Column {
                name: trimmed.to_string(),
                alias,
                formula,
                cells: Vec::new(),
            }
        }).collect()
    }

    fn parse_row(&mut self, line: &str, expected_columns: usize) -> Option<Row> {
        let cell_strings = self.split_row(line);
        if cell_strings.len() != expected_columns {
            self.errors.push(ValidationError {
                error_type: "parse".to_string(),
                row: None,
                column: None,
                message: format!("Row has {} columns, expected {}", cell_strings.len(), expected_columns),
            });
            return None;
        }
        let cells = cell_strings.into_iter().map(|s| Self::parse_cell(&s)).collect();
        Some(Row { cells })
    }

    fn parse_cell(cell_str: &str) -> Cell {
        let mut trimmed = cell_str.trim();
        let mut bold = false;
        
        if trimmed.starts_with("**") && trimmed.ends_with("**") && trimmed.len() >= 4 {
            bold = true;
            trimmed = &trimmed[2..trimmed.len() - 2];
        } else if trimmed.starts_with("__") && trimmed.ends_with("__") && trimmed.len() >= 4 {
            bold = true;
            trimmed = &trimmed[2..trimmed.len() - 2];
        }
        
        if !trimmed.contains('=') {
            if trimmed.starts_with('*') && trimmed.ends_with('*') && trimmed.len() >= 2 {
                trimmed = &trimmed[1..trimmed.len() - 1];
            } else if trimmed.starts_with('_') && trimmed.ends_with('_') && trimmed.len() >= 2 {
                trimmed = &trimmed[1..trimmed.len() - 1];
            }
        }
        trimmed = trimmed.trim();
        
        if trimmed.is_empty() {
            return Cell {
                value: CellValue::Null,
                label: None,
                formula: None,
                effective_formula: None,
                computed: None,
                error: None,
                bold: if bold { Some(true) } else { None },
                is_column_formula: None,
            };
        }
        
        if let Some(eq_idx) = trimmed.find('=') {
            if eq_idx > 0 {
                let display_val = trimmed[..eq_idx].trim();
                let formula = trimmed[eq_idx + 1..].trim().to_string();
                return Cell {
                    value: Self::parse_value(display_val),
                    label: None,
                    formula: Some(formula),
                    effective_formula: None,
                    computed: None,
                    error: None,
                    bold: if bold { Some(true) } else { None },
                    is_column_formula: None,
                };
            }
        }
        
        if trimmed.starts_with('=') {
            return Cell {
                value: CellValue::Null,
                label: None,
                formula: Some(trimmed[1..].trim().to_string()),
                effective_formula: None,
                computed: None,
                error: None,
                bold: if bold { Some(true) } else { None },
                is_column_formula: None,
            };
        }
        
        Cell {
            value: Self::parse_value(trimmed),
            label: None,
            formula: None,
            effective_formula: None,
            computed: None,
            error: None,
            bold: if bold { Some(true) } else { None },
            is_column_formula: None,
        }
    }

    fn parse_value(s: &str) -> CellValue {
        if s.is_empty() {
            return CellValue::Null;
        }
        let lower = s.to_lowercase();
        if lower == "true" {
            return CellValue::Boolean(true);
        }
        if lower == "false" {
            return CellValue::Boolean(false);
        }
        if let Ok(num) = s.parse::<f64>() {
            return CellValue::Number(num);
        }
        if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
            if s.len() >= 2 {
                return CellValue::String(s[1..s.len() - 1].to_string());
            }
        }
        CellValue::String(s.to_string())
    }

    fn split_row(&self, line: &str) -> Vec<String> {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 2 {
            parts[1..parts.len() - 1].iter().map(|s| s.trim().to_string()).collect()
        } else {
            Vec::new()
        }
    }

    fn empty_table(&self) -> ParsedTable {
        ParsedTable {
            table: Table {
                columns: Vec::new(),
                rows: Vec::new(),
                labels: HashMap::new(),
                aliases: HashMap::new(),
            },
            dependencies: DependencyGraph::default(),
            errors: self.errors.clone(),
        }
    }
}
