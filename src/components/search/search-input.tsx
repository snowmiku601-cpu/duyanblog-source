"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

/**
 * Search field that grabs focus (and selects any existing query) on mount, so
 * pressing "/" in the header lands you ready to type.
 */
export function SearchInput({ defaultValue, className }: { defaultValue?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    if (input.value) input.select();
  }, []);

  return (
    <Input
      ref={ref}
      id="q"
      type="search"
      name="q"
      defaultValue={defaultValue}
      placeholder="Try “eSIM”, “hosting”, “VPN”…"
      className={className}
      autoComplete="search"
    />
  );
}
