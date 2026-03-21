// React wrappers for CalcMD Web Components
import React, { useEffect, useRef } from 'react';
import type { ParsedTable } from '@calcmd/core';
import type { CalcMDPreview, CalcMDEditor } from './index';

// Import Web Components to register them
import './preview';
import './editor';

interface PreviewProps {
  table: ParsedTable;
  selectedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
}

export function Preview({ table, selectedCell, onCellClick }: PreviewProps) {
  const ref = useRef<CalcMDPreview>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      onCellClick?.(detail.row, detail.col);
    };

    el.addEventListener('cell-click', handler);
    return () => el.removeEventListener('cell-click', handler);
  }, [onCellClick]);

  return <calcmd-preview ref={ref} table={table} selectedCell={selectedCell} />;
}

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  parsedTable?: ParsedTable;
  onShare?: () => Promise<boolean> | boolean;
}

export function Editor({ value, onChange, parsedTable, onShare }: EditorProps) {
  const ref = useRef<CalcMDEditor>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const changeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      onChange?.(detail);
    };

    const shareHandler = async () => {
      if (onShare) {
        const result = await onShare();
        if (el) el.setAttribute('shared', result ? 'ok' : 'err');
        setTimeout(() => el?.setAttribute('shared', 'idle'), 1800);
      }
    };

    el.addEventListener('value-change', changeHandler);
    el.addEventListener('share-request', shareHandler);

    return () => {
      el.removeEventListener('value-change', changeHandler);
      el.removeEventListener('share-request', shareHandler);
    };
  }, [onChange, onShare]);

  return <calcmd-editor ref={ref} value={value} parsedTable={parsedTable} showShare={!!onShare} />;
}
