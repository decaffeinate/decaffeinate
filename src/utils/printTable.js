/* @flow */

import repeat from 'repeating';

type Table = {
  rows: Array<Array<string>>,
  columns: Array<{ id: string, align: 'left' | 'right' }>
};

export default function printTable(table: Table, buffer: string=' '): string {
  let widths = [];
  table.rows.forEach(row => {
    row.forEach((cell, i) => {
      if (widths.length <= i) {
        widths[i] = cell.length;
      }
      else if (widths[i] < cell.length) {
        widths[i] = cell.length;
      }
    });
  });
  let output = '';
  table.rows.forEach(row => {
    row.forEach((cell, i) => {
      let column = table.columns[i];
      if (column.align === 'left') {
        output += cell;
      } else if (column.align === 'right') {
        output += repeat(widths[i] - cell.length, ' ') + cell;
      }
      if (i < row.length - 1) {
        output += buffer;
      }
    });
    output += '\n';
  });
  return output;
}
