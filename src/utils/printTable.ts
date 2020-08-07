export interface Column {
  id: string;
  align: 'left' | 'right';
}

export interface Table {
  rows: Array<Array<string>>;
  columns: Array<Column>;
}

export default function printTable(table: Table, buffer = ' '): string {
  const widths: Array<number> = [];
  table.rows.forEach((row) => {
    row.forEach((cell, i) => {
      if (widths.length <= i) {
        widths[i] = cell.length;
      } else if (widths[i] < cell.length) {
        widths[i] = cell.length;
      }
    });
  });
  let output = '';
  table.rows.forEach((row) => {
    row.forEach((cell, i) => {
      const column = table.columns[i];
      if (column.align === 'left') {
        output += cell;
      } else if (column.align === 'right') {
        output += ' '.repeat(widths[i] - cell.length) + cell;
      }
      if (i < row.length - 1) {
        output += buffer;
      }
    });
    output += '\n';
  });
  return output;
}
