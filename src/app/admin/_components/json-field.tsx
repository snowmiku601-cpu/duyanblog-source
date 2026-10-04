"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { FormRow } from "./form-row";

/**
 * Collapsible JSON textarea that validates on blur and reports a clear error.
 * Used for article Blocks / Scores / Sources and comparison attribute editors.
 * On submit, parents call parseJsonField() to get parsed data or an error.
 */
export function JsonField({
  label,
  value,
  onChange,
  hint,
  rows = 8,
  placeholder,
  defaultOpen = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  defaultOpen?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  function handleBlur() {
    if (!value.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON");
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="col-span-full">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1.5">
            {open ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {label}
            {!open && value.trim() && <span className="text-xs font-normal text-muted-foreground">(has content)</span>}
          </Button>
        </CollapsibleTrigger>
        {error && !open && <span className="truncate text-xs text-destructive">{error}</span>}
      </div>
      <CollapsibleContent className="pt-2">
        <FormRow label={label} hint={hint} error={error}>
          <Textarea
            value={value}
            rows={rows}
            placeholder={placeholder}
            spellCheck={false}
            className="font-mono text-xs"
            onChange={(e) => {
              onChange(e.target.value);
              if (error) setError(null);
            }}
            onBlur={handleBlur}
          />
        </FormRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Parse a JSON textarea value on submit with a friendly error. */
export function parseJsonField(
  label: string,
  raw: string,
  fallback: unknown = []
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!raw.trim()) return { ok: true, data: fallback };
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? `${label}: invalid JSON — ${e.message}` : `${label}: invalid JSON`,
    };
  }
}
