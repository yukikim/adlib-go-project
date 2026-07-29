"use client";

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchableComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchableCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = '選択してください',
  searchPlaceholder = '候補を検索',
  emptyMessage = '一致する候補がありません。',
  disabled = false,
  className,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  const filteredOptions = normalizedQuery.length === 0
    ? options
    : options.filter((option) => option.toLocaleLowerCase('en-US').includes(normalizedQuery));

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        className="h-8 w-full justify-between bg-background font-normal"
        onClick={() => {
          setQuery(value);
          setOpen((current) => !current);
        }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn('truncate', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value || placeholder}
        </span>
        <ChevronDown className="size-4 opacity-70" />
      </Button>

      {open ? (
        <div className="absolute top-full z-50 mt-2 w-full rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10 bg-gray-500">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="bg-background pl-8 pr-8"
              autoFocus
            />
            {query ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setQuery('')}
                aria-label="検索文字をクリア"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border bg-background/60">
            {value ? (
              <button
                type="button"
                className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                onClick={() => {
                  onValueChange('');
                  setQuery('');
                  setOpen(false);
                }}
              >
                選択をクリア
                <X className="size-4" />
              </button>
            ) : null}

            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <ul role="listbox" className="py-1">
                {filteredOptions.slice(0, 80).map((option) => {
                  const selected = option === value;
                  return (
                    <li key={option}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60',
                          selected ? 'bg-muted/70 font-medium text-foreground' : 'text-foreground',
                        )}
                        onClick={() => {
                          onValueChange(option);
                          setQuery(option);
                          setOpen(false);
                        }}
                      >
                        <span className="truncate">{option}</span>
                        <Check className={cn('size-4', selected ? 'opacity-100' : 'opacity-0')} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}