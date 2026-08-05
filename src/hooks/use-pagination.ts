'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 5;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

function storageKeyFor(listKey: string) {
  return `pageSize:${listKey}`;
}

function readSavedPageSize(listKey: string): PageSizeOption | null {
  try {
    const saved = Number(localStorage.getItem(storageKeyFor(listKey)));
    return PAGE_SIZE_OPTIONS.includes(saved as PageSizeOption)
      ? (saved as PageSizeOption)
      : null;
  } catch {
    return null;
  }
}

function writeSavedPageSize(listKey: string, size: PageSizeOption) {
  try {
    localStorage.setItem(storageKeyFor(listKey), String(size));
  } catch {
    // private mode / quota
  }
}

export interface UsePaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: PageSizeOption;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  setPage: (page: number) => void;
  setPageSize: (size: PageSizeOption) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination<T>(
  listKey: string,
  items: T[],
  /** bump when filters/search change to reset to page 1 */
  resetDeps: unknown[] = [],
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const saved = readSavedPageSize(listKey);
    if (saved) setPageSizeState(saved);
  }, [listKey]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, listKey, ...resetDeps]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  const setPageSize = useCallback(
    (size: PageSizeOption) => {
      setPageSizeState(size);
      writeSavedPageSize(listKey, size);
      setPage(1);
    },
    [listKey],
  );

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  return {
    items: pagedItems,
    total,
    page: safePage,
    pageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
  };
}
