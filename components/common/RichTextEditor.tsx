"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    ClassicEditor?: any;
  }
}

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  autosaveKey?: string;
  className?: string;
  build?: "classic" | "balloon" | "inline" | "super"; // super uses super-build CDN
};

const CDN_VERSION = "41.4.2";

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src='${src}']`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("CKEditor CDN failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    (s as any)._loaded = false;
    s.addEventListener("load", () => {
      (s as any)._loaded = true;
      resolve();
    });
    s.addEventListener("error", () => reject(new Error("CKEditor CDN failed to load")));
    document.body.appendChild(s);
  });
}

export const RichTextEditor: React.FC<Props> = ({
  value = "",
  onChange,
  placeholder = "Tulis artikel Anda di sini…",
  autosaveKey,
  className = "",
  build = "classic",
}) => {
  const holderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [focused, setFocused] = useState(false);

  // Resolve CDN url
  const src = useMemo(() => {
    switch (build) {
      case "classic":
        return `https://cdn.ckeditor.com/ckeditor5/${CDN_VERSION}/classic/ckeditor.js`;
      case "balloon":
        return `https://cdn.ckeditor.com/ckeditor5/${CDN_VERSION}/balloon/ckeditor.js`;
      case "inline":
        return `https://cdn.ckeditor.com/ckeditor5/${CDN_VERSION}/inline/ckeditor.js`;
      default:
        return `https://cdn.ckeditor.com/ckeditor5/${CDN_VERSION}/super-build/ckeditor.js`;
    }
  }, [build]);

  // Initialize editor
  useEffect(() => {
    let destroyed = false;
    let instance: any;

    (async () => {
      await loadScriptOnce(src);
      if (destroyed) return;
      const Classic = window.ClassicEditor;
      if (!Classic) return;

      instance = await Classic.create(holderRef.current!, {
        placeholder,
        toolbar: {
          shouldNotGroupWhenFull: true,
          items: [
            // Text group
            "undo","redo","|","bold","italic","underline","strikethrough","|",
            // Structure
            "heading","bulletedList","numberedList","blockquote","horizontalLine","|",
            // Insert
            "link","insertTable","imageUpload","codeBlock","mediaEmbed"
          ],
        },
        // Remove premium plugins (super-build ships these, we keep only OSS)
        removePlugins: [
          "CKBox","CKFinder","EasyImage","RealTimeCollaborativeComments","RealTimeCollaborativeTrackChanges","RealTimeCollaborativeRevisionHistory","PresenceList","Comments","TrackChanges","TrackChangesData","RevisionHistory","Pagination","WProofreader","MathType"
        ],
      });

      editorRef.current = instance;
      // Set initial data
      if (value) instance.setData(value);

      instance.model.document.on("change:data", () => {
        const data = instance.getData();
        if (autosaveKey) try { localStorage.setItem(autosaveKey, data); } catch {}
        onChange?.(data);
      });

      instance.editing.view.document.on("focus", () => setFocused(true));
      instance.editing.view.document.on("blur", () => setFocused(false));
    })();

    return () => {
      destroyed = true;
      if (instance) {
        instance.destroy();
      }
    };
  }, [src, placeholder, autosaveKey, onChange]);

  // Sync external value
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.getData();
    if (value !== current) ed.setData(value || "");
  }, [value]);

  // Load from autosave on mount if provided
  useEffect(() => {
    if (!autosaveKey) return;
    try {
      const saved = localStorage.getItem(autosaveKey);
      if (saved && !value) editorRef.current?.setData(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`w-full rounded-xl border bg-white shadow-sm p-2 ${focused ? "ring-2 ring-blue-500" : "border-gray-200"} ${className}`}>
      <div ref={holderRef} aria-label="Rich text editor" />
    </div>
  );
};
