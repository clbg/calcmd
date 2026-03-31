import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ParsedTable } from '@calcmd/core';
import { format as formatMarkdown, fill as fillComputedValues } from '@calcmd/core';

@customElement('calcmd-editor')
export class CalcMDEditor extends LitElement {
  @property({ type: String }) value = '';
  @property({ type: Object }) parsedTable?: ParsedTable;
  @property({ type: Boolean }) showShare = false;
  @property({ type: String }) shared: 'idle' | 'ok' | 'err' = 'idle';

  @state() private copied: 'idle' | 'ok' | 'err' = 'idle';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid var(--border, #e4ddd0);
      background: var(--surface, #f5f0e8);
      flex-shrink: 0;
    }

    .toolbar-group {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: transparent;
      border: 1px solid var(--border, #e4ddd0);
      color: var(--muted, #7a6e5d);
      padding: 0.25rem 0.6rem;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.75rem;
      font-family: inherit;
      transition:
        color 0.15s,
        border-color 0.15s;
      white-space: nowrap;
    }

    .toolbar-button:hover:not(:disabled) {
      color: var(--text, #2c2418);
      border-color: var(--accent, #b8632e);
    }

    .toolbar-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .share-button {
      background: rgba(184, 99, 46, 0.08);
      border: 1px solid var(--accent, #b8632e);
      color: var(--accent, #b8632e);
      font-weight: 500;
    }

    .share-button.success {
      background: rgba(184, 99, 46, 0.15);
    }

    .share-button.error {
      border-color: var(--error, #a63d2f);
      color: var(--error, #a63d2f);
    }

    .editor-textarea {
      flex: 1;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      outline: none;
      background: var(--surface, #f5f0e8);
      color: var(--text, #2c2418);
      font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
      font-size: 0.82rem;
      line-height: 1.6;
      resize: none;
      tab-size: 2;
      white-space: pre;
      overflow-x: auto;
      overflow-y: auto;
      word-wrap: normal;
    }

    .editor-textarea::placeholder {
      color: var(--muted, #7a6e5d);
    }

    svg {
      width: 13px;
      height: 13px;
      fill: currentColor;
    }
  `;

  private handleFormat() {
    const formatted = formatMarkdown(this.value);
    this.dispatchEvent(new CustomEvent('value-change', { detail: formatted }));
  }

  private handleFill() {
    if (!this.parsedTable) return;
    const filled = fillComputedValues(this.value, this.parsedTable);
    this.dispatchEvent(new CustomEvent('value-change', { detail: filled }));
  }

  private async handleCopy() {
    try {
      await navigator.clipboard.writeText(this.value);
      this.copied = 'ok';
    } catch {
      this.copied = 'err';
    }
    setTimeout(() => (this.copied = 'idle'), 1800);
  }

  private async handleShare() {
    this.dispatchEvent(new CustomEvent('share-request'));
  }

  private handleInput(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(new CustomEvent('value-change', { detail: value }));
  }

  render() {
    return html`
      <div class="editor-toolbar">
        <div class="toolbar-group">
          <button
            class="toolbar-button"
            @click=${this.handleFormat}
            title="Auto-align markdown table columns"
          >
            <svg viewBox="0 0 16 16">
              <path d="M1 2h14v1.5H1zm0 4h10v1.5H1zm0 4h14v1.5H1zm0 4h10v1.5H1z" />
            </svg>
            Format
          </button>

          <button
            class="toolbar-button"
            @click=${this.handleFill}
            ?disabled=${!this.parsedTable}
            title="Evaluate formulas and fill computed values"
          >
            <svg viewBox="0 0 16 16">
              <path
                d="M3 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5L9.5 1H3zm6 .5L13.5 5H10a1 1 0 0 1-1-1V1.5zM5 8.5h1.5V7H8v1.5h1.5V10H8v1.5H6.5V10H5V8.5z"
              />
            </svg>
            Fill Values
          </button>

          <button
            class="toolbar-button"
            @click=${this.handleCopy}
            title="Copy markdown to clipboard"
          >
            ${this.copied === 'ok'
              ? html`
                  <svg viewBox="0 0 16 16">
                    <path
                      d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
                    />
                  </svg>
                  Copied
                `
              : this.copied === 'err'
                ? html`
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 5v4.5h1.5V5h-1.5zm0 5.5V12h1.5v-1.5h-1.5z"
                      />
                    </svg>
                    Failed
                  `
                : html`
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1H8v1H2V5h1V4H2z"
                      />
                    </svg>
                    Copy
                  `}
          </button>
        </div>

        ${this.showShare
          ? html`
              <button
                class="toolbar-button share-button ${this.shared === 'ok'
                  ? 'success'
                  : this.shared === 'err'
                    ? 'error'
                    : ''}"
                @click=${this.handleShare}
                title="Copy share link to clipboard"
              >
                ${this.shared === 'ok'
                  ? html`
                      <svg viewBox="0 0 16 16">
                        <path
                          d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
                        />
                      </svg>
                      Link Copied
                    `
                  : this.shared === 'err'
                    ? html`
                        <svg viewBox="0 0 16 16">
                          <path
                            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 5v4.5h1.5V5h-1.5zm0 5.5V12h1.5v-1.5h-1.5z"
                          />
                        </svg>
                        Failed
                      `
                    : html`
                        <svg viewBox="0 0 16 16">
                          <path
                            d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z"
                          />
                        </svg>
                        Share
                      `}
              </button>
            `
          : ''}
      </div>

      <textarea
        class="editor-textarea"
        .value=${this.value}
        @input=${this.handleInput}
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      ></textarea>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'calcmd-editor': CalcMDEditor;
  }
}
