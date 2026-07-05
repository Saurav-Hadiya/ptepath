'use client';

import { Inbox } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/shared/EmptyState';

interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-border-default bg-bg-card shadow-card">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="border-border-default bg-bg-page hover:bg-bg-page">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`text-label-sm font-bold tracking-wide text-text-secondary uppercase ${column.width ?? ''}`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="border-border-default">
                {columns.map((column) => (
                  <TableCell key={column.key} className="py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && data.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-0">
                <EmptyState icon={Inbox} title={emptyMessage} />
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="border-border-default hover:bg-bg-page">
                {columns.map((column) => (
                  <TableCell key={column.key} className="text-body-sm text-text-primary">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
