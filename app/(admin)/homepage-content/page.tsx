"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, Play, Plus, Trash2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import {
  getHomepage,
  updateHeroWithFile,
  updateHeroWithUrl,
  updateVideoYoutube,
  updateVideoFile,
  deleteVideo as apiDeleteVideo,
  createSlider,
  deleteSlider as apiDeleteSlider,
  reorderSliders,
  type HomepagePayload,
} from "@/services/homepage.service";

type Media = {
  id: string | number;
  url: string;
  name?: string;
  sizeKB?: number;
  file?: File | null; // <-- penting
};

function bytesToKB(size?: number) {
  if (!size) return undefined;
  return Math.round(size / 1024);
}

const GROUP1 = "carousel1";
const GROUP2 = "carousel2";

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
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({
    show: false,
    msg: "",
  });

  // file inputs
  const heroInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const slider1Input = useRef<HTMLInputElement>(null);
  const slider2Input = useRef<HTMLInputElement>(null);

  // snapshot awal buat diff
  const initialRef = useRef<{
    heroUrl: string | null;
    videoMode: "youtube" | "file" | null;
    videoUrl: string | null;
    videoFileUrl: string | null;
    slider1Ids: number[];
    slider2Ids: number[];
  }>({
    heroUrl: null,
    videoMode: null,
    videoUrl: null,
    videoFileUrl: null,
    slider1Ids: [],
    slider2Ids: [],
  });

  function pickFile(ref: React.RefObject<HTMLInputElement>) {
    ref.current?.click();
  }

  // === simpan file ke state ===
  function onPickOne(e: React.ChangeEvent<HTMLInputElement>, cb: (m: Media) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    cb({ id: crypto.randomUUID(), url, name: file.name, sizeKB: bytesToKB(file.size), file }); // <-- simpan file
    e.target.value = "";
  }

  function onPickMany(e: React.ChangeEvent<HTMLInputElement>, setList: React.Dispatch<React.SetStateAction<Media[]>>) {
    const files = e.target.files;
    if (!files?.length) return;
    const next: Media[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
      sizeKB: bytesToKB(f.size),
      file: f, // <-- simpan file
    }));
    setList((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  /* =======================
     LOAD EXISTING CONTENT
     ======================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await getHomepage();
        const data = res.data as HomepagePayload;

        // hero
        const heroUrl = data.hero?.image_url ?? null;
        initialRef.current.heroUrl = heroUrl;
        setHero(heroUrl ? { id: "hero", url: heroUrl } : null);

        // video
        const vMode = data.video?.mode ?? null;
        const vUrl = data.video?.url ?? null;
        const vFileUrl = data.video?.file_url ?? null;
        initialRef.current.videoMode = vMode;
        initialRef.current.videoUrl = vUrl;
        initialRef.current.videoFileUrl = vFileUrl;

        if (vMode === "youtube") {
          setVideoMode("link");
          setYoutubeUrl(vUrl || "");
          setVideo(null);
        } else if (vMode === "file") {
          setVideoMode("upload");
          setVideo(vFileUrl ? { id: "video", url: vFileUrl } : null);
        } else {
          setVideoMode("link");
          setYoutubeUrl("");
          setVideo(null);
        }

        // sliders
        const s1 = (data.sliders?.[GROUP1] || []).map((it) => ({ id: it.id, url: it.image_url }));
        const s2 = (data.sliders?.[GROUP2] || []).map((it) => ({ id: it.id, url: it.image_url }));
        setSlider1(s1);
        setSlider2(s2);
        initialRef.current.slider1Ids = s1.map((x) => Number(x.id)).filter(Boolean) as number[];
        initialRef.current.slider2Ids = s2.map((x) => Number(x.id)).filter(Boolean) as number[];
      } catch (e: any) {
        setToast({ show: true, msg: e?.message || "Gagal memuat homepage", variant: "error" });
      }
    })();
  }, []);

  /* =======================
     SAVE (POST/PATCH/DELETE)
     ======================= */
  const onSave = async () => {
    try {
      setSaving(true);

      // HERO
      const heroChangedUrl = (initialRef.current.heroUrl || null) !== (hero?.url || null);
      if (hero) {
        if (hero.file) {
          await updateHeroWithFile(hero.file);
        } else if (heroChangedUrl && hero.url) {
          await updateHeroWithUrl(hero.url);
        }
      }

      // VIDEO
      const initialMode = initialRef.current.videoMode; // 'youtube' | 'file' | null
      if (videoMode === "link") {
        if (!youtubeUrl && (initialMode === "youtube" || initialMode === "file")) {
          await apiDeleteVideo(); // hapus
        } else if (youtubeUrl && (initialMode !== "youtube" || youtubeUrl !== initialRef.current.videoUrl)) {
          await updateVideoYoutube(youtubeUrl);
        }
      } else {
        if (video?.file) {
          await updateVideoFile(video.file);
        }
      }

      // SLIDERS: diff
      const now1Ids = slider1.map((m) => (typeof m.id === "number" ? m.id : undefined)).filter(Boolean) as number[];
      const now2Ids = slider2.map((m) => (typeof m.id === "number" ? m.id : undefined)).filter(Boolean) as number[];
      const removed1 = initialRef.current.slider1Ids.filter((id) => !now1Ids.includes(id));
      const removed2 = initialRef.current.slider2Ids.filter((id) => !now2Ids.includes(id));

      for (const id of [...removed1, ...removed2]) {
        await apiDeleteSlider(id);
      }

      // create baru (item belum punya id numerik, dan punya file)
      const new1 = slider1.filter((m) => typeof m.id !== "number" && m.file);
      const new2 = slider2.filter((m) => typeof m.id !== "number" && m.file);

      for (let idx = 0; idx < new1.length; idx++) {
        const m = new1[idx];
        if (m.file) await createSlider(GROUP1, { file: m.file }, idx);
      }
      for (let idx = 0; idx < new2.length; idx++) {
        const m = new2[idx];
        if (m.file) await createSlider(GROUP2, { file: m.file }, idx);
      }

      // reorder existing (yang sudah punya id)
      const orders1 = slider1
        .map((m, i) => (typeof m.id === "number" ? { id: m.id, sort: i } : null))
        .filter(Boolean) as Array<{ id: number; sort: number }>;
      if (orders1.length) await reorderSliders(GROUP1, orders1);

      const orders2 = slider2
        .map((m, i) => (typeof m.id === "number" ? { id: m.id, sort: i } : null))
        .filter(Boolean) as Array<{ id: number; sort: number }>;
      if (orders2.length) await reorderSliders(GROUP2, orders2);

      setToast({ show: true, msg: "Homepage content saved", variant: "success" });

      // refresh snapshot
      const res = await getHomepage();
      const data = res.data as HomepagePayload;
      initialRef.current.heroUrl = data.hero?.image_url ?? null;
      initialRef.current.videoMode = data.video?.mode ?? null;
      initialRef.current.videoUrl = data.video?.url ?? null;
      initialRef.current.videoFileUrl = data.video?.file_url ?? null;
      initialRef.current.slider1Ids = (data.sliders?.[GROUP1] || []).map((x) => x.id);
      initialRef.current.slider2Ids = (data.sliders?.[GROUP2] || []).map((x) => x.id);
    } catch (e: any) {
      setToast({ show: true, msg: e?.message || "Gagal menyimpan homepage", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // === styles (layout tidak diubah) ===
  const card = "rounded-2xl border border-gray-200 bg-white shadow-sm";
  const sectionTitle = "text-base font-semibold text-gray-800";
  const label = "mb-2 block text-sm font-medium text-gray-700";
  const dashed =
    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:bg-gray-50 transition-all duration-300";
  const orangeBtn =
    "inline-flex items-center gap-2 text-sm font-medium text-[#F97316] hover:text-[#ea6a0b] transition-colors";
  const deleteBtn =
    "inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors";

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
            <button
              onClick={() => pickFile(slider1Input)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              aria-label="Upload New Image"
            >
              <Plus className="h-4 w-4" /> Upload New Image
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider1.map((img) => (
              <figure key={img.id} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]">
                <img src={img.url} alt={img.name || "slider"} className="h-40 w-full rounded-lg object-cover" />
                <div className="mt-2">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    aria-label={`Delete ${img.name || "image"}`}
                    onClick={() => setSlider1((prev) => prev.filter((i) => i.id !== img.id))}
                  >
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
            <button
              onClick={() => pickFile(slider2Input)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              aria-label="Upload New Image"
            >
              <Plus className="h-4 w-4" /> Upload New Image
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider2.map((img) => (
              <figure key={img.id} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]">
                <img src={img.url} alt={img.name || "slider"} className="h-40 w-full rounded-lg object-cover" />
                <div className="mt-2">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    aria-label={`Delete ${img.name || "image"}`}
                    onClick={() => setSlider2((prev) => prev.filter((i) => i.id !== img.id))}
                  >
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