import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import type { ParsedTable } from '@calcmd/core';
import { formatValue } from '@calcmd/core';

type CellRole = 'selected' | 'input' | 'dependent' | null;

function buildReverseDeps(table: ParsedTable): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();
  for (const [from, deps] of table.dependencies.edges) {
    for (const to of deps) {
      if (!reverse.has(to)) reverse.set(to, new Set());
      reverse.get(to)!.add(from);
    }
  }
  return reverse;
}

function cellId(row: number, col: number): string {
  return `R${row}.C${col}`;
}

const ROLE_STYLES: Record<NonNullable<CellRole>, Record<string, string>> = {
  selected: {
    outline: '2px solid var(--highlight-selected)',
    outlineOffset: '-2px',
    background: 'rgba(167,139,250,0.12)',
  },
  input: {
    outline: '2px solid #3fb950',
    outlineOffset: '-2px',
    background: 'rgba(63,185,80,0.10)',
  },
  dependent: {
    outline: '2px solid rgba(210,153,34,0.9)',
    outlineOffset: '-2px',
    background: 'rgba(210,153,34,0.10)',
  },
};

const HEADER_ROLE_STYLES: Record<NonNullable<CellRole>, Record<string, string>> = {
  selected: {
    borderBottom: '3px solid var(--highlight-selected)',
    background: 'rgba(167,139,250,0.12)',
  },
  input: { borderBottom: '3px solid #3fb950', background: 'rgba(63,185,80,0.10)' },
  dependent: {
    borderBottom: '3px solid rgba(210,153,34,0.9)',
    background: 'rgba(210,153,34,0.10)',
  },
};

@customElement('calcmd-preview')
export class CalcMDPreview extends LitElement {
  @property({ type: Object }) table?: ParsedTable;
  @property({ type: Object }) selectedCell: { row: number; col: number } | null = null;

  @state() private selectedCol: number | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .preview-container {
      width: 100%;
      overflow: auto;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .preview-header {
      background: #1c2128;
      border-bottom: 1px solid var(--border, #30363d);
      padding: 0.6rem 1rem;
      text-align: left;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 1;
      white-space: nowrap;
      cursor: pointer;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .header-name {
      font-size: 0.85rem;
      color: var(--muted, #8b949e);
    }

    .header-formula {
      font-size: 0.78rem;
      color: var(--formula-color, #58a6ff);
      font-weight: normal;
    }

    .preview-cell {
      border-bottom: 1px solid var(--border, #30363d);
      padding: 0.6rem 1rem;
      cursor: pointer;
      transition: background 0.1s;
      white-space: nowrap;
    }

    .preview-cell:hover {
      background: rgba(167, 139, 250, 0.05);
    }

    .cell-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .cell-value {
      flex: 1;
    }

    .cell-formula-indicator {
      color: var(--formula-color, #58a6ff);
      font-weight: bold;
      font-size: 0.7rem;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .cell-error {
      color: var(--error, #f85149);
      font-weight: 600;
    }

    .has-formula {
      background: var(--formula-bg, #1c2d3f);
      color: var(--formula-color, #58a6ff);
      border-left: 2px solid var(--formula-border, #388bfd);
    }

    .has-formula:hover {
      background: rgba(28, 45, 63, 0.8);
    }

    .has-error {
      background: rgba(248, 81, 73, 0.08);
      border-left: 2px solid var(--error, #f85149);
    }

    .label-row .preview-cell:first-child {
      color: var(--accent, #58a6ff);
      font-weight: 600;
    }
  `;

  private get reverseDeps(): Map<string, Set<string>> {
    return this.table ? buildReverseDeps(this.table) : new Map();
  }

  private get cellRoleMap(): Map<string, CellRole> {
    const map = new Map<string, CellRole>();
    if (!this.selectedCell || !this.table) return map;

    const id = cellId(this.selectedCell.row, this.selectedCell.col);
    map.set(id, 'selected');

    const deps = this.table.dependencies.edges.get(id);
    if (deps) for (const dep of deps) map.set(dep, 'input');

    const rdeps = this.reverseDeps.get(id);
    if (rdeps)
      for (const dep of rdeps) {
        if (!map.has(dep)) map.set(dep, 'dependent');
      }

    return map;
  }

  private get colRoleMap(): Map<number, CellRole> {
    const map = new Map<number, CellRole>();
    if (this.selectedCol === null || !this.table) return map;

    map.set(this.selectedCol, 'selected');

    const rowCount = this.table.rows.length;
    const inputCols = new Set<number>();
    const dependentCols = new Set<number>();

    for (let r = 0; r < rowCount; r++) {
      const id = cellId(r, this.selectedCol);
      const deps = this.table.dependencies.edges.get(id);
      if (deps)
        for (const dep of deps) {
          const match = dep.match(/^R\d+\.C(\d+)$/);
          if (match) inputCols.add(Number(match[1]));
        }
      const rdeps = this.reverseDeps.get(id);
      if (rdeps)
        for (const dep of rdeps) {
          const match = dep.match(/^R\d+\.C(\d+)$/);
          if (match) dependentCols.add(Number(match[1]));
        }
    }

    for (const c of inputCols) if (c !== this.selectedCol) map.set(c, 'input');
    for (const c of dependentCols) if (!map.has(c)) map.set(c, 'dependent');

    return map;
  }

  private handleColClick(colIndex: number) {
    this.selectedCol = this.selectedCol === colIndex ? null : colIndex;
    this.dispatchEvent(new CustomEvent('cell-click', { detail: { row: -1, col: -1 } }));
  }

  private handleCellClick(row: number, col: number) {
    this.selectedCol = null;
    this.dispatchEvent(new CustomEvent('cell-click', { detail: { row, col } }));
  }

  private getCellClasses(rowIndex: number, colIndex: number): Record<string, boolean> {
    if (!this.table) {
      return {
        'preview-cell': true,
        'has-formula': false,
        'has-agg': false,
        'has-error': false,
        'label-row': false,
      };
    }

    const cell = this.table.rows[rowIndex].cells[colIndex];
    const column = this.table.columns[colIndex];
    const hasFormula = !!(cell.formula || column.formula);
    const hasAgg = hasFormula && /sum|avg|min|max|count/i.test(cell.formula ?? '');
    const isLabelRow = this.table.rows[rowIndex].cells.some((c) => c.label);

    return {
      'preview-cell': true,
      'has-formula': hasFormula && !hasAgg,
      'has-agg': hasAgg,
      'has-error': !!cell.error,
      'label-row': isLabelRow,
    };
  }

  private getCellTitle(rowIndex: number, colIndex: number): string {
    if (!this.table) return '';

    const cell = this.table.rows[rowIndex].cells[colIndex];
    const column = this.table.columns[colIndex];
    const parts: string[] = [];
    if (column.formula) parts.push(`Column formula: ${column.formula}`);
    if (cell.formula) parts.push(`Cell formula: ${cell.formula}`);
    if (cell.computed !== undefined) parts.push(`Computed: ${cell.computed}`);
    if (cell.error) parts.push(`Error: ${cell.error}`);
    return parts.join('\n');
  }

  render() {
    if (!this.table) {
      return html`<div class="preview-container">No table data</div>`;
    }

    return html`
      <div class="preview-container">
        <table class="preview-table">
          <thead>
            <tr>
              ${this.table.columns.map((col: (typeof this.table.columns)[0], i: number) => {
                const role = this.selectedCol !== null ? (this.colRoleMap.get(i) ?? null) : null;
                const styles = role ? HEADER_ROLE_STYLES[role] : {};
                return html`
                  <th
                    class="preview-header"
                    style=${styleMap({ cursor: 'pointer', ...styles })}
                    @click=${() => this.handleColClick(i)}
                    title=${col.formula ? `Column formula: ${col.formula}` : nothing}
                  >
                    <div class="header-content">
                      <span class="header-name">${col.name}</span>
                      ${col.formula
                        ? html`<span class="header-formula">= ${col.formula}</span>`
                        : nothing}
                    </div>
                  </th>
                `;
              })}
            </tr>
          </thead>
          <tbody>
            ${this.table.rows.map(
              (row: (typeof this.table.rows)[0], rowIndex: number) => html`
                <tr>
                  ${row.cells.map((cell: (typeof row.cells)[0], colIndex: number) => {
                    const role =
                      this.selectedCol !== null
                        ? null
                        : (this.cellRoleMap.get(cellId(rowIndex, colIndex)) ?? null);
                    const styles = role ? ROLE_STYLES[role] : {};
                    return html`
                      <td
                        class=${classMap(this.getCellClasses(rowIndex, colIndex))}
                        title=${this.getCellTitle(rowIndex, colIndex)}
                        @click=${() => this.handleCellClick(rowIndex, colIndex)}
                        style=${styleMap(styles)}
                      >
                        <div class="cell-content">
                          ${cell.error
                            ? html`<span class="cell-error">#ERROR</span>`
                            : html`
                                <span class="cell-value">
                                  ${formatValue(
                                    cell.computed !== undefined ? cell.computed : cell.value,
                                  )}
                                </span>
                                ${cell.formula
                                  ? html`<span class="cell-formula-indicator">ƒ</span>`
                                  : nothing}
                              `}
                        </div>
                      </td>
                    `;
                  })}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'calcmd-preview': CalcMDPreview;
  }
}
