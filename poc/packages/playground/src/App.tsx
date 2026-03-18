import React, { useState, useCallback } from 'react';
import { calcmd, ParsedTable } from '@calcmd/core';
import Editor from './Editor';
import Preview from './Preview';
import './App.css';
import { EXAMPLES } from './examples';

function App() {
  const [markdown, setMarkdown] = useState(EXAMPLES[0].markdown);
  const [result, setResult] = useState<ParsedTable | null>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number; col: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdown(value);
    
    try {
      const parsed = calcmd(value);
      setResult(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const loadExample = useCallback((index: number) => {
    handleMarkdownChange(EXAMPLES[index].markdown);
    setSelectedCell(null);
  }, [handleMarkdownChange]);

  // Initial parse
  React.useEffect(() => {
    handleMarkdownChange(markdown);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calc<span className="accent">MD</span> Playground</h1>
        <div className="examples">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => loadExample(i)}>
              {ex.name}
            </button>
          ))}
        </div>
      </header>

      <div className="App-content">
        <div className="panel editor-panel">
          <h2>Editor</h2>
          <Editor 
            value={markdown} 
            onChange={handleMarkdownChange} 
          />
        </div>

        <div className="panel preview-panel">
          <h2>Preview</h2>
          {error && (
            <div className="error-banner">
              <strong>Error:</strong> {error}
            </div>
          )}
          {result && (
            <Preview 
              table={result} 
              selectedCell={selectedCell}
              onCellClick={handleCellClick}
            />
          )}
          {result && result.errors.length > 0 && (
            <div className="errors">
              <h3>Errors & Warnings</h3>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i} className={`error-${err.type}`}>
                    <strong>{err.type}</strong>
                    {err.row !== undefined && ` (Row ${err.row + 1})`}
                    {err.column && ` (${err.column})`}
                    : {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
