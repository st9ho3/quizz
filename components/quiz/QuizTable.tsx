"use client";

import type { Table as TableType } from "@/lib/interfaces";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface QuizTableProps {
  tableData: TableType;
}

export function QuizTable({ tableData }: QuizTableProps) {
  return (
    <div className="my-4 overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {tableData.headers.map((header, index) => (
              <TableHead key={index} className="font-semibold">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
