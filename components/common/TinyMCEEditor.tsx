"use client";

import React, { useMemo } from "react";
import { Editor } from "@tinymce/tinymce-react";

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  autosaveKey?: string;
  className?: string;
};

export const TinyMCEEditor: React.FC<Props> = ({
  value = "",
  onChange,
  placeholder = "Tulis artikel Anda di sini…",
  autosaveKey,
  className = "",
}) => {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "";

  const handleChange = (content: string) => {
    try {
      if (autosaveKey) localStorage.setItem(autosaveKey, content);
    } catch {}
    onChange?.(content);
  };

  return (
    <div className={`w-full ${className}`}>
      

<Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
          // value={field.value}
          // onEditorChange={field.onChange}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "help",
              "wordcount",
              "code",
              "fontsize",
            ],
            toolbar:
              "undo redo | blocks | bold italic backcolor | " +
              "alignleft aligncenter alignright alignjustify | " +
              "bullist numlist outdent indent | removeformat | " +
              "fontsize | a11ycheck code table help",

            // Inline CSS untuk heading & paragraf
            formats: {
              
              body: { block: "p", styles: { fontSize: "18px" } },
              h1: { block: "h1", styles: { fontSize: "30px" } },
              h2: { block: "h2", styles: { fontSize: "26px" } },
              h3: { block: "h3", styles: { fontSize: "22px" } },
              h4: { block: "h4", styles: { fontSize: "18px" } },
              p: { block: "p", styles: { fontSize: "18px" } },
            },

            style_formats: [
              { title: "Body", format: "body" },
              { title: "Heading 1", format: "h1" },
              { title: "Heading 2", format: "h2" },
              { title: "Heading 3", format: "h3" },
              { title: "Heading 4", format: "h4" },
              { title: "Paragraph", format: "p" },
            ],

            font_size_formats:
              "10px 12px 14px 16px 18px 20px 22px 24px 26px 28px 30px 32px 36px 40px 44px",

            // Styling untuk tampilan editor (bukan output)
            content_style: `
                  body {        font-size: 18px !important;  }
                  p  { font-size:18px !important; }
                  h1 { font-size:30px !important; }
                  h2 { font-size:26px !important; }
                  h3 { font-size:22px !important; }
                  h4 { font-size:18px !important; }
                `,   
                setup: function (editor: any) {
                  editor.on('init', function () {
                    editor.getBody().style.fontSize = '18px';
                    //editor.getBody().style.lineHeight = '1.6';
                  });
                },
          }}
        />
    </div>
  );
};
