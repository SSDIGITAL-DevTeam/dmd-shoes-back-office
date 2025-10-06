"use client";

import { useEffect, useRef, useState } from "react";

export function useAutosave<T>(value: T, opts: { key: string; delay?: number; onSave?: (v: T) => Promise<void> | void }) {
  const { key, delay = 1500, onSave } = opts;
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      try {
        localStorage.setItem(key, JSON.stringify(value));
        if (onSave) await onSave(value);
        setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, key, delay, onSave]);

  const load = () => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  const clear = () => localStorage.removeItem(key);

  return { saving, savedAt, load, clear };
}

