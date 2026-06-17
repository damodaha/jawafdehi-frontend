import { visit } from "unist-util-visit";
import type { Root, Element, Text } from "hast";

const COLS_PREFIX = /^\s*@cols=(\d+):/;
const DELIMITER_CELL = /^\s*:?-+:?\s*$/;

function countCells(line: string): number {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").length;
}

function isDelimiterRow(line: string): boolean {
  if (!line.includes("|")) return false;
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  const cells = s.split("|");
  return cells.length >= 1 && cells.every((c) => DELIMITER_CELL.test(c));
}

/**
 * GFM only recognizes a table when its header row has the same number of cells
 * as its delimiter row. Case documents author `@cols=N:` colspan tables with a
 * short header (one cell per logical group) but a full-width delimiter, which
 * GFM rejects outright — the whole block renders as a paragraph of literal
 * pipes. This pads each such header row with empty trailing cells so GFM parses
 * the table; rehypeColspan then applies the spans and drops the padding.
 */
export function padColspanTableHeaders(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (!isDelimiterRow(lines[i])) continue;
    const header = lines[i - 1];
    if (!header || !header.includes("|")) continue;
    const delimCount = countCells(lines[i]);
    const headerCount = countCells(header);
    if (headerCount >= delimCount) continue;
    const trimmed = header.replace(/\s*$/, "");
    const prefix = /\|$/.test(trimmed) ? trimmed : `${trimmed} |`;
    lines[i - 1] = prefix + "  |".repeat(delimCount - headerCount);
  }
  return lines.join("\n");
}

function firstTextNode(node: Element): Text | undefined {
  for (const child of node.children) {
    if (child.type === "text") return child as Text;
    if (child.type === "element") {
      const found = firstTextNode(child as Element);
      if (found) return found;
    }
  }
  return undefined;
}

function isCell(node: unknown): node is Element {
  return (
    !!node &&
    (node as Element).type === "element" &&
    ((node as Element).tagName === "td" || (node as Element).tagName === "th")
  );
}

/**
 * Renders the case-document `@cols=N:` colspan notation. GFM tables can't span
 * columns, so authors prefix a cell with `@cols=N:` and the table's delimiter
 * row declares the real (wider) column count. GFM then pads each row with empty
 * trailing cells. This plugin strips the prefix, sets colSpan on the cell, and
 * drops the padding cells once a row's spans cover the column count.
 */
export default function rehypeColspan() {
  return (tree: Root) => {
    visit(tree, "element", (table: Element) => {
      if (table.tagName !== "table") return;

      const rows: Element[] = [];
      visit(table, "element", (el: Element) => {
        if (el.tagName === "tr") rows.push(el);
      });

      const columnCount = rows.reduce(
        (max, row) => Math.max(max, row.children.filter(isCell).length),
        0,
      );
      if (columnCount === 0) return;

      for (const row of rows) {
        const kept: Element[] = [];
        let covered = 0;
        for (const cell of row.children) {
          if (!isCell(cell)) continue;
          if (covered >= columnCount) continue; // trailing GFM padding cell

          let span = 1;
          const text = firstTextNode(cell);
          const match = text?.value.match(COLS_PREFIX);
          if (text && match) {
            span = Number(match[1]);
            text.value = text.value.replace(COLS_PREFIX, "");
            cell.properties = { ...cell.properties, colSpan: span };
          }
          covered += span;
          kept.push(cell);
        }
        row.children = kept;
      }
    });
  };
}
