'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
  type UsePaginationResult,
} from '@/hooks/use-pagination';

interface PaginationProps<T> {
  pager: Pick<
    UsePaginationResult<T>,
    | 'total'
    | 'page'
    | 'pageSize'
    | 'totalPages'
    | 'rangeStart'
    | 'rangeEnd'
    | 'setPage'
    | 'setPageSize'
    | 'nextPage'
    | 'prevPage'
  >;
  className?: string;
}

export function Pagination<T>({ pager, className = '' }: PaginationProps<T>) {
  if (pager.total === 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t ${className}`}
    >
      <p className="text-xs text-muted-foreground">
        Showing {pager.rangeStart}–{pager.rangeEnd} of {pager.total}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Per page</span>
          <Select
            value={String(pager.pageSize)}
            onValueChange={(v) => pager.setPageSize(Number(v) as PageSizeOption)}
          >
            <SelectTrigger className="h-8 w-[72px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={pager.page <= 1}
            onClick={pager.prevPage}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">
            Page {pager.page} of {pager.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={pager.page >= pager.totalPages}
            onClick={pager.nextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
