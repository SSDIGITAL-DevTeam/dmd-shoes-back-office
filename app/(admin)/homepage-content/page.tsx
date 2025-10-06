"use client";

import React, { useMemo, useRef, useState } from "react";
import { Upload, Play, X, Plus, Trash2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

type Media = { id: string; url: string; name?: string; sizeKB?: number };

function bytesToKB(size?: number) {
  if (!size) return undefined;
  return Math.round(size / 1024);
}

export default function HomepageContentPage() {
  // Hero
  const [hero, setHero] = useState<Media | null>(null);

  // Video
  const [videoMode, setVideoMode] = useState<"link" | "upload">("link");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [video, setVideo] = useState<Media | null>(null);

  // Sliders
  const [slider1, setSlider1] = useState<Media[]>([]);
  const [slider2, setSlider2] = useState<Media[]>([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  // file inputs
  const heroInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const slider1Input = useRef<HTMLInputElement>(null);
  const slider2Input = useRef<HTMLInputElement>(null);

  function pickFile(ref: React.RefObject<HTMLInputElement>) {
    ref.current?.click();
  }

  function onPickOne(e: React.ChangeEvent<HTMLInputElement>, cb: (m: Media) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    cb({ id: crypto.randomUUID(), url, name: file.name, sizeKB: bytesToKB(file.size) });
    e.target.value = "";
  }

  function onPickMany(e: React.ChangeEvent<HTMLInputElement>, setList: React.Dispatch<React.SetStateAction<Media[]>>) {
    const files = e.target.files;
    if (!files?.length) return;
    const next: Media[] = Array.from(files).map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name, sizeKB: bytesToKB(f.size) }));
    setList((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  const onSave = async () => {
    setSaving(true);
    // In real app, send to API.
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setToast({ show: true, msg: "Homepage content saved", variant: "success" });
  };

  // Common upload card styles
  const card = "rounded-2xl border border-gray-200 bg-white shadow-sm";
  const sectionTitle = "text-base font-semibold text-gray-800";
  const label = "mb-2 block text-sm font-medium text-gray-700";
  const dashed = "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:bg-gray-50 transition-all duration-300";
  const orangeBtn = "inline-flex items-center gap-2 text-sm font-medium text-[#F97316] hover:text-[#ea6a0b] transition-colors";
  const deleteBtn = "inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors";

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Homepage Content</h1>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-50"
          aria-label="Save Changes"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Hero Section */}
        <section className={card} aria-labelledby="hero-title">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 id="hero-title" className={sectionTitle}>Hero Section</h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label className={label}>Image</label>

            {hero ? (
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="relative overflow-hidden rounded-lg">
                  <img src={hero.url} alt={hero.name || "hero"} className="w-full rounded-lg object-cover transition-all duration-300 hover:scale-105" />
                  {hero.name && (
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {hero.name}{hero.sizeKB ? ` · ${hero.sizeKB} KB` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <button onClick={() => pickFile(heroInput)} className={orangeBtn} aria-label="Change Image">
                    <Upload className="h-4 w-4" />
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <label className={dashed} onClick={() => pickFile(heroInput)} aria-label="Upload hero image">
                <Upload className="h-5 w-5" />
                <span className="mt-1">Upload hero image</span>
              </label>
            )}

            <input ref={heroInput} type="file" accept="image/*" hidden onChange={(e) => onPickOne(e, setHero)} />
          </div>
        </section>

        {/* Video Section */}
        <section className={card} aria-labelledby="video-title">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 id="video-title" className={sectionTitle}>Video Section</h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label className={label}>Video</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="videoMode" checked={videoMode === "link"} onChange={() => setVideoMode("link")} />
                Link to YouTube URL
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="videoMode" checked={videoMode === "upload"} onChange={() => setVideoMode("upload")} />
                Upload Video
              </label>
            </div>

            {videoMode === "link" ? (
              <input
                aria-label="YouTube URL"
                placeholder="Paste the YouTube video URL here"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            ) : (
              <>
                {video ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="relative overflow-hidden rounded-lg">
                      <img src={video.url} alt={video.name || "video"} className="w-full rounded-lg object-cover" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-md">
                          <Play className="h-6 w-6" />
                        </span>
                      </span>
                      {video.name && (
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          {video.name}{video.sizeKB ? ` · ${video.sizeKB} KB` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <button onClick={() => pickFile(videoInput)} className={orangeBtn} aria-label="Change Video">
                        <Upload className="h-4 w-4" />
                        Change Video
                      </button>
                      <button onClick={() => setVideo(null)} className={deleteBtn} aria-label="Delete Video">
                        <Trash2 className="h-4 w-4" />
                        Delete Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={dashed} onClick={() => pickFile(videoInput)} aria-label="Upload video">
                    <Upload className="h-5 w-5" />
                    <span className="mt-1">Upload video</span>
                  </label>
                )}
                <input ref={videoInput} type="file" accept="video/*,image/*" hidden onChange={(e) => onPickOne(e, setVideo)} />
              </>
            )}
          </div>
        </section>

        {/* Slider 1 */}
        <section className={card} aria-labelledby="slider1-title">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="slider1-title" className={sectionTitle}>Slider 1</h2>
            <button onClick={() => pickFile(slider1Input)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50" aria-label="Upload New Image">
              <Plus className="h-4 w-4" /> Upload New Image
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider1.map((img) => (
              <figure key={img.id} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]">
                <img src={img.url} alt={img.name || "slider"} className="h-40 w-full rounded-lg object-cover" />
                <div className="mt-2">
                  <button className={deleteBtn} aria-label={`Delete ${img.name || "image"}`} onClick={() => setSlider1((prev) => prev.filter((i) => i.id !== img.id))}>
                    <Trash2 className="h-4 w-4" /> Delete Image
                  </button>
                </div>
              </figure>
            ))}
          </div>
          <input ref={slider1Input} type="file" accept="image/*" multiple hidden onChange={(e) => onPickMany(e, setSlider1)} />
        </section>

        {/* Slider 2 */}
        <section className={card} aria-labelledby="slider2-title">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="slider2-title" className={sectionTitle}>Slider 2</h2>
            <button onClick={() => pickFile(slider2Input)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50" aria-label="Upload New Image">
              <Plus className="h-4 w-4" /> Upload New Image
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider2.map((img) => (
              <figure key={img.id} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]">
                <img src={img.url} alt={img.name || "slider"} className="h-40 w-full rounded-lg object-cover" />
                <div className="mt-2">
                  <button className={deleteBtn} aria-label={`Delete ${img.name || "image"}`} onClick={() => setSlider2((prev) => prev.filter((i) => i.id !== img.id))}>
                    <Trash2 className="h-4 w-4" /> Delete Image
                  </button>
                </div>
              </figure>
            ))}
          </div>
          <input ref={slider2Input} type="file" accept="image/*" multiple hidden onChange={(e) => onPickMany(e, setSlider2)} />
        </section>
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
}

