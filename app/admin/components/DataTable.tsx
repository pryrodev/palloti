"use client";

import { useState } from "react";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";

type DataTableProps<TData extends object> = {
  columns: ColumnDef<DataGridFeatures, TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  emptyMessage: string;
  isLoading?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  onRowClick?: (row: TData) => void;
};

export default function DataTable<TData extends object>({
  columns,
  data,
  getRowId,
  emptyMessage,
  isLoading = false,
  pageSize = 10,
  pageSizes = [10, 20, 50],
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    getRowId,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      tableLayout={{ dense: true, rowBorder: true, headerBorder: true }}
      tableClassNames={{ base: "min-w-[1240px]", headerRow: "bg-[#fbf7f1]" }}
    >
      <DataGridContainer className="rounded-none border-0 shadow-none">
        <DataGridScrollArea orientation="horizontal">
          <DataGridTable />
        </DataGridScrollArea>
        <DataGridPagination
          sizes={pageSizes}
          sizesLabel="Rows per page"
          info="{from}–{to} of {count} records"
          className="border-t border-[#eadfd2] px-3 py-2"
        />
      </DataGridContainer>
    </DataGrid>
  );
}
