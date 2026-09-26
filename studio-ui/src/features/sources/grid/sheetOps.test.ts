import { describe, expect, it } from 'vitest';
import { clearRange, moveRows, normalise, parseTsv, toTsv, writeBlock, type Sheet } from './sheetOps';

const sheet = (): Sheet => ({
  columns: [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }],
  rows: [{ _id: '1', a: 'a1', b: 'b1' }, { _id: '2', a: 'a2', b: 'b2' }]
});

describe('tsv', () => {
  it('round-trips quoted cells with tabs, quotes and newlines', () => {
    const values = [['x', 'line 1\nline 2'], ['say "hi"', 'tab\there']];
    expect(parseTsv(toTsv(values))).toEqual(values);
  });
  it('parses Excel clipboard text with CRLF and a trailing newline', () => {
    expect(parseTsv('a\tb\r\nc\td\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });
});

describe('writeBlock', () => {
  it('grows the sheet and reports clipped columns', () => {
    const result = writeBlock(sheet(), { r: 1, c: 1 }, [['x', 'extra'], ['y', 'extra']]);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[1].b).toBe('x');
    expect(result.rows[2].b).toBe('y');
    expect(result.rows[1].a).toBe('a2');
    expect(result.clippedColumns).toBe(1);
    expect(result.range).toEqual({ top: 1, left: 1, bottom: 2, right: 1 });
  });
  it('fills a selection with a single value', () => {
    const result = writeBlock(sheet(), { r: 0, c: 0 }, [['z']], normalise({ r: 0, c: 0 }, { r: 1, c: 1 }));
    expect(result.rows.map((row) => [row.a, row.b])).toEqual([['z', 'z'], ['z', 'z']]);
  });
});

describe('row edits', () => {
  it('clears only the range', () => {
    const rows = clearRange(sheet(), { top: 0, bottom: 0, left: 1, right: 1 });
    expect(rows[0]).toMatchObject({ a: 'a1', b: '' });
    expect(rows[1]).toMatchObject({ a: 'a2', b: 'b2' });
  });
  it('moves rows and refuses to leave the sheet', () => {
    expect(moveRows(sheet(), 1, 1, -1)?.map((row) => row._id)).toEqual(['2', '1']);
    expect(moveRows(sheet(), 0, 0, -1)).toBeNull();
  });
});
