import Papa from 'papaparse';
import type { Source, SourceRow } from '@/api/types';

export const CSV_LIMITS = { bytes: 2_000_000, columns: 30, rows: 5000 };

export function parseCsv(file: File): Promise<Omit<Source, 'id'>> {
  return new Promise((resolve, reject) => {
    if (file.size > CSV_LIMITS.bytes) { reject(new Error('CSV 不能超过 2 MB')); return; }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        if (result.errors.length || !headers.length) { reject(new Error('CSV 解析失败，请检查文件格式')); return; }
        if (headers.length > CSV_LIMITS.columns || result.data.length > CSV_LIMITS.rows) {
          reject(new Error('CSV 超过 30 列或 5000 行')); return;
        }
        const columns = headers.map((title, index) => ({ key: `c${index + 1}`, title: title.trim() || `列 ${index + 1}` }));
        const rows = result.data.map((entry) => {
          const row: SourceRow = { _id: crypto.randomUUID() };
          headers.forEach((title, index) => { row[`c${index + 1}`] = String(entry[title] ?? ''); });
          return row;
        });
        resolve({ name: file.name.replace(/\.csv$/i, ''), columns, rows });
      },
      error: (error) => reject(error)
    });
  });
}

export function downloadCsv(source: Source) {
  const csv = Papa.unparse({
    fields: source.columns.map((column) => column.title),
    data: source.rows.map((row) => source.columns.map((column) => row[column.key] ?? ''))
  }, { escapeFormulae: true });
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${source.name.replace(/[^\w一-龥-]/g, '_') || 'datasource'}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
