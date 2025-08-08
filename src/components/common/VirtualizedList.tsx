"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  getItemKey = (_, index) => index,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(height / itemHeight);
    const end = Math.min(start + visibleCount + overscan, items.length);
    const startIndex = Math.max(0, start - overscan);
    
    return { start: startIndex, end };
  }, [scrollTop, itemHeight, height, overscan, items.length]);

  // Calculate total height and transform
  const totalHeight = items.length * itemHeight;
  const transform = `translateY(${visibleRange.start * itemHeight}px)`;

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Scroll to item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;
    
    let targetScrollTop = index * itemHeight;
    
    if (align === 'center') {
      targetScrollTop = targetScrollTop - height / 2 + itemHeight / 2;
    } else if (align === 'end') {
      targetScrollTop = targetScrollTop - height + itemHeight;
    }
    
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - height));
    
    containerRef.current.scrollTop = targetScrollTop;
  }, [itemHeight, height, totalHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    scrollToItem(0);
  }, [scrollToItem]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    scrollToItem(items.length - 1, 'end');
  }, [scrollToItem, items.length]);

  // Expose scroll methods
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToItem = scrollToItem;
      (containerRef.current as any).scrollToTop = scrollToTop;
      (containerRef.current as any).scrollToBottom = scrollToBottom;
    }
  }, [scrollToItem, scrollToTop, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform,
          }}
        >
          {items.slice(visibleRange.start, visibleRange.end).map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={getItemKey(item, actualIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Virtualized table component
interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  rowHeight: number;
  columns: {
    key: string;
    header: string;
    width?: number | string;
    render: (item: T, index: number) => React.ReactNode;
  }[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

function VirtualizedTable<T>({
  items,
  height,
  rowHeight,
  columns,
  className,
  headerClassName,
  rowClassName,
  getItemKey = (_, index) => index,
}: VirtualizedTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(height / rowHeight);
    const end = Math.min(start + visibleCount + 5, items.length);
    const startIndex = Math.max(0, start - 5);
    
    return { start: startIndex, end };
  }, [scrollTop, rowHeight, height, items.length]);

  // Calculate total height and transform
  const totalHeight = items.length * rowHeight;
  const transform = `translateY(${visibleRange.start * rowHeight}px)`;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
      {/* Header */}
      <div className={cn('flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', headerClassName)}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: height - 48 }} // Subtract header height
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform,
            }}
          >
            {items.slice(visibleRange.start, visibleRange.end).map((item, index) => {
              const actualIndex = visibleRange.start + index;
              return (
                <div
                  key={getItemKey(item, actualIndex)}
                  className={cn(
                    'flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    rowClassName
                  )}
                  style={{ height: rowHeight }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex items-center"
                      style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
                    >
                      {column.render(item, actualIndex)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { VirtualizedList, VirtualizedTable };
export default VirtualizedList; 