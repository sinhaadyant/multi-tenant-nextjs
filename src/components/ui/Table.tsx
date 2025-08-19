"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn("[&_tr]:border-b", className)}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <tr className={cn(
      "border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50 dark:hover:bg-gray-800/50 dark:data-[state=selected]:bg-gray-800",
      className
    )}>
      {children}
    </tr>
  );
};

const TableHead: React.FC<TableHeadProps> = ({ children, className }) => {
  return (
    <th className={cn(
      "h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0",
      className
    )}>
      {children}
    </th>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, className }) => {
  return (
    <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}>
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
