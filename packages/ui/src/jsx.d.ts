// TypeScript JSX declarations for CalcMD Web Components
import type { ParsedTable } from '@calcmd/core';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'calcmd-preview': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          table?: ParsedTable;
          selectedCell?: { row: number; col: number } | null;
          ref?: React.Ref<import('./preview').CalcMDPreview>;
        },
        HTMLElement
      >;
      'calcmd-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          value?: string;
          parsedTable?: ParsedTable;
          showShare?: boolean;
          shared?: 'idle' | 'ok' | 'err';
          ref?: React.Ref<import('./editor').CalcMDEditor>;
        },
        HTMLElement
      >;
    }
  }
}

export {};
