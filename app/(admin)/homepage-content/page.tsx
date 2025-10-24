// app/(admin)/homepage-content/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import {
  getHomepage,
  updateHeroWithFile,
  updateHeroWithUrl,
  // pakai nama yg benar sesuai service
  updateVideoByYoutubeUrl,
  updateVideoByFile,
  deleteVideo as apiDeleteVideo,
  createSlider,
  deleteSlider as apiDeleteSlider,
  reorderSliders,
  // HAPUS: type HomepagePayload (tidak diekspor di service)
} from "@/services/homepage.service";

type Media = {
  id: string | number;
  url: string;
  name?: string;
  sizeKB?: number;
  file?: File | null;
};

function bytesToKB(size?: number) {
  if (!size) return undefined;
  return Math.round(size / 1024);
}

// ==== Type guards / helpers untuk ID ====
const isNumericId = (v: string | number | undefined | null): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toNumericId = (v: string | number | undefined | null): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

// Bandingkan array id (untuk tahu apakah urutan berubah)
const idsEqual = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// Hanya anggap valid jika http/https (hindari blob:)
const isHttpUrl = (u?: string | null) => !!u && /^(https?:)?\/\//i.test(u || "");

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
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    variant?: "success" | "error";
  }>({ show: false, msg: "" });

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

  // ===== helpers =====
  function pickFile(ref: React.RefObject<HTMLInputElement>) {
    ref.current?.click();
  }

  function onPickOne(
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (m: Media) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    cb({
      id: crypto.randomUUID(),
      url,
      name: file.name,
      sizeKB: bytesToKB(file.size),
      file,
    });
    e.target.value = "";
  }

  function onPickMany(
    e: React.ChangeEvent<HTMLInputElement>,
    setList: React.Dispatch<React.SetStateAction<Media[]>>
  ) {
    const files = e.target.files;
    if (!files?.length) return;
    const next: Media[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
      sizeKB: bytesToKB(f.size),
      file: f,
    }));
    setList((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  // revoke object URLs saat unmount untuk hindari memory leak
  useEffect(() => {
    return () => {
      if (hero?.file && hero.url?.startsWith("blob:"))
        URL.revokeObjectURL(hero.url);
      if (video?.file && video.url?.startsWith("blob:"))
        URL.revokeObjectURL(video.url);
      [slider1, slider2].forEach((arr) =>
        arr.forEach((m) => {
          if (m.file && m.url?.startsWith("blob:")) URL.revokeObjectURL(m.url);
        })
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================
     LOAD EXISTING CONTENT
     ======================= */
  async function refetch() {
    try {
      const res = await getHomepage();
      const data: any = res?.data ?? res; // fallback kalau envelope

      // hero
      const heroUrl: string | null = data?.hero?.image_url ?? null;
      initialRef.current.heroUrl = heroUrl;
      setHero(heroUrl ? { id: "hero", url: heroUrl } : null);

      // video
      const videoObj: any = data?.video ?? {};
      const vMode = (videoObj.mode ?? null) as "youtube" | "file" | null;
      const vUrl = (videoObj.url ?? null) as string | null;
      const vFileUrl = (videoObj.file_url ?? videoObj.fileUrl ?? null) as
        | string
        | null;

      initialRef.current.videoMode = vMode;
      initialRef.current.videoUrl = vUrl;
      initialRef.current.videoFileUrl = vFileUrl;

      if (vMode === "youtube") {
        setVideoMode("link");
        setYoutubeUrl(vUrl || "");
        setVideo(null);
      } else if (vMode === "file") {
        setVideoMode("upload");
        setYoutubeUrl("");
        setVideo(vFileUrl ? { id: "video", url: vFileUrl } : null);
      } else {
        setVideoMode("link");
        setYoutubeUrl("");
        setVideo(null);
      }

      // sliders
      const s1: Media[] = ((data?.sliders?.[GROUP1] as any[]) ?? []).map(
        (it: any) => ({
          id: it.id,
          url: it.image_url,
        })
      );
      const s2: Media[] = ((data?.sliders?.[GROUP2] as any[]) ?? []).map(
        (it: any) => ({
          id: it.id,
          url: it.image_url,
        })
      );
      setSlider1(s1);
      setSlider2(s2);
      initialRef.current.slider1Ids = s1
        .map((x) => Number(x.id))
        .filter(Number.isFinite) as number[];
      initialRef.current.slider2Ids = s2
        .map((x) => Number(x.id))
        .filter(Number.isFinite) as number[];
    } catch (e: any) {
      setToast({
        show: true,
        msg: e?.message || "Gagal memuat homepage",
        variant: "error",
      });
    }
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================
     SAVE (POST/PATCH/DELETE)
     ======================= */
  const onSave = async () => {
    try {
      setSaving(true);

      // ===== HERO =====
      const heroChangedUrl =
        (initialRef.current.heroUrl || null) !== (hero?.url || null);

      if (hero) {
        if (hero.file) {
          // kirim sebagai FormData (pola product)
          const fd = new FormData();
          fd.append("image", hero.file);
          await updateHeroWithFile(fd as any); // cast supaya aman ke 2 versi service (File/FormData)
        } else if (heroChangedUrl && isHttpUrl(hero.url)) {
          await updateHeroWithUrl({ image_url: hero.url } as any); // dukung versi yg terima string atau object
        }
      }

      // ===== VIDEO =====
      const initialMode = initialRef.current.videoMode; // 'youtube' | 'file' | null
      if (videoMode === "link") {
        const trimmed = youtubeUrl.trim();
        if (!trimmed && (initialMode === "youtube" || initialMode === "file")) {
          await apiDeleteVideo();
        } else if (
          trimmed &&
          (initialMode !== "youtube" || trimmed !== initialRef.current.videoUrl)
        ) {
          await updateVideoByYoutubeUrl({ youtube_url: trimmed } as any);
        }
      } else {
        if (video?.file) {
          const fd = new FormData();
          fd.append("video", video.file);
          await updateVideoByFile(fd as any);
        }
      }

      // ===== SLIDERS =====
      const now1Ids = slider1
        .map((m) => toNumericId(m.id))
        .filter((n): n is number => n !== null);

      const now2Ids = slider2
        .map((m) => toNumericId(m.id))
        .filter((n): n is number => n !== null);

      const removed1 = initialRef.current.slider1Ids.filter(
        (id) => !now1Ids.includes(id)
      );
      const removed2 = initialRef.current.slider2Ids.filter(
        (id) => !now2Ids.includes(id)
      );

      for (const id of [...removed1, ...removed2]) {
        await apiDeleteSlider(id);
      }

      // Create baru (item belum punya id numerik & punya file)
      const new1 = slider1.filter((m) => !isNumericId(m.id) && m.file);
      const new2 = slider2.filter((m) => !isNumericId(m.id) && m.file);

      for (let i = 0; i < new1.length; i++) {
        const m = new1[i];
        if (m.file) {
          const sort = slider1.findIndex((x) => x.id === m.id);
          const fd = new FormData();
          fd.append("image", m.file);
          fd.append("group", GROUP1);
          fd.append("sort", String(Math.max(0, sort)));
          await createSlider(fd as any);
        }
      }
      for (let i = 0; i < new2.length; i++) {
        const m = new2[i];
        if (m.file) {
          const sort = slider2.findIndex((x) => x.id === m.id);
          const fd = new FormData();
          fd.append("image", m.file);
          fd.append("group", GROUP2);
          fd.append("sort", String(Math.max(0, sort)));
          await createSlider(fd as any);
        }
      }

      // Reorder existing (yang sudah punya id numerik)
      const orders1 = slider1
        .map((m, i) => {
          const idNum = toNumericId(m.id);
          return idNum !== null ? { id: idNum, sort: i } : null;
        })
        .filter(Boolean) as Array<{ id: number; sort: number }>;
      const orders2 = slider2
        .map((m, i) => {
          const idNum = toNumericId(m.id);
          return idNum !== null ? { id: idNum, sort: i } : null;
        })
        .filter(Boolean) as Array<{ id: number; sort: number }>;

      const now1OnlyIds = orders1.map((o) => o.id);
      const now2OnlyIds = orders2.map((o) => o.id);

      // panggil reorderSliders dengan cast supaya cocok ke 2 versi signature
      if (
        !idsEqual(now1OnlyIds, initialRef.current.slider1Ids) &&
        orders1.length
      ) {
        await (reorderSliders as any)(GROUP1, orders1);
        // alternatif service lama:
        // await (reorderSliders as any)({ group: GROUP1, orders: orders1 });
        // await (reorderSliders as any)({ ids: now1OnlyIds });
      }
      if (
        !idsEqual(now2OnlyIds, initialRef.current.slider2Ids) &&
        orders2.length
      ) {
        await (reorderSliders as any)(GROUP2, orders2);
      }

      setToast({
        show: true,
        msg: "Homepage content saved",
        variant: "success",
      });
      await refetch();
    } catch (e: any) {
      setToast({
        show: true,
        msg: e?.message || "Gagal menyimpan homepage",
        variant: "error",
      });
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Homepage Content
        </h1>
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
            <h2 id="hero-title" className={sectionTitle}>
              Hero Section
            </h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label className={label}>Image</label>

            {hero ? (
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={hero.url}
                    alt={hero.name || "hero"}
                    className="w-full rounded-lg object-cover transition-all duration-300 hover:scale-105"
                  />
                  {hero.name && (
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {hero.name}
                      {hero.sizeKB ? ` · ${hero.sizeKB} KB` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    onClick={() => pickFile(heroInput)}
                    className={orangeBtn}
                    aria-label="Change Image"
                  >
                    <Upload className="h-4 w-4" />
                    Change Image
                  </button>
                  {/* Tidak ada tombol Remove/Delete hero */}
                </div>
              </div>
            ) : (
              <label
                className={dashed}
                onClick={() => pickFile(heroInput)}
                aria-label="Upload hero image"
              >
                <Upload className="h-5 w-5" />
                <span className="mt-1">Upload hero image</span>
              </label>
            )}

            <input
              ref={heroInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onPickOne(e, setHero)}
            />
          </div>
        </section>

        {/* Video Section */}
        <section className={card} aria-labelledby="video-title">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 id="video-title" className={sectionTitle}>
              Video Section
            </h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label className={label}>Video</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="videoMode"
                  checked={videoMode === "link"}
                  onChange={() => setVideoMode("link")}
                />
                Link to YouTube URL
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="videoMode"
                  checked={videoMode === "upload"}
                  onChange={() => setVideoMode("upload")}
                />
                Upload Video
              </label>
            </div>

            {videoMode === "link" ? (
              <div className="flex gap-3">
                <input
                  aria-label="YouTube URL"
                  placeholder="Paste the YouTube video URL here"
                  className="w-full rounded-md border border-gray-300 text-black px-3 py-2 text-sm"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                {initialRef.current.videoMode && (
                  <button
                    type="button"
                    className={deleteBtn}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        await apiDeleteVideo();
                        await refetch();
                        setToast({
                          show: true,
                          msg: "Video dihapus",
                          variant: "success",
                        });
                      } catch (e: any) {
                        setToast({
                          show: true,
                          msg: e?.message || "Gagal menghapus video",
                          variant: "error",
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Current
                  </button>
                )}
              </div>
            ) : (
              <>
                {video ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="relative overflow-hidden rounded-lg">
                      <video
                        src={video.url}
                        className="w-full rounded-lg"
                        controls
                      />
                      {video.name && (
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                          {video.name}
                          {video.sizeKB ? ` · ${video.sizeKB} KB` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => pickFile(videoInput)}
                        className={orangeBtn}
                        aria-label="Change Video"
                      >
                        <Upload className="h-4 w-4" />
                        Change Video
                      </button>
                      <button
                        onClick={() => {
                          if (video?.file && video.url?.startsWith("blob:"))
                            URL.revokeObjectURL(video.url);
                          setVideo(null);
                        }}
                        className={deleteBtn}
                        aria-label="Delete Video (local state)"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                      {initialRef.current.videoMode === "file" && (
                        <button
                          onClick={async () => {
                            try {
                              setSaving(true);
                              await apiDeleteVideo();
                              await refetch();
                              setToast({
                                show: true,
                                msg: "Video dihapus",
                                variant: "success",
                              });
                            } catch (e: any) {
                              setToast({
                                show: true,
                                msg: e?.message || "Gagal menghapus video",
                                variant: "error",
                              });
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className={deleteBtn}
                          aria-label="Delete Video from server"
                        >
                          <Trash2 className="h-4 w-4" /> Delete Current
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    className={dashed}
                    onClick={() => pickFile(videoInput)}
                    aria-label="Upload video"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="mt-1">Upload video</span>
                  </label>
                )}
                <input
                  ref={videoInput}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => onPickOne(e, setVideo)}
                />
              </>
            )}
          </div>
        </section>

        {/* Slider 1 */}
        <section className={card} aria-labelledby="slider1-title">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="slider1-title" className={sectionTitle}>
              Slider 1
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => pickFile(slider1Input)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                aria-label="Upload New Image"
              >
                <Plus className="h-4 w-4" /> Upload New Image
              </button>
              {slider1.some((s) => isNumericId(s.id)) && (
                <button
                  onClick={async () => {
                    const orders = slider1
                      .map((m, i) => {
                        const idNum = toNumericId(m.id);
                        return idNum !== null ? { id: idNum, sort: i } : null;
                      })
                      .filter(Boolean) as Array<{ id: number; sort: number }>;
                    if (!orders.length) return;

                    const idsOnly = orders.map((o) => o.id);
                    if (idsEqual(idsOnly, initialRef.current.slider1Ids))
                      return; // tidak berubah

                    try {
                      setSaving(true);
                      await (reorderSliders as any)(GROUP1, orders);
                      setToast({
                        show: true,
                        msg: "Urutan slider 1 disimpan",
                        variant: "success",
                      });
                      initialRef.current.slider1Ids = idsOnly;
                    } catch (e: any) {
                      setToast({
                        show: true,
                        msg: e?.message || "Gagal simpan urutan slider 1",
                        variant: "error",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Save Order
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider1.map((img) => (
              <figure
                key={img.id}
                className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]"
              >
                <img
                  src={img.url}
                  alt={img.name || "slider"}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <div className="mt-2">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    aria-label={`Delete ${img.name || "image"}`}
                    onClick={() => {
                      if (isNumericId(img.id)) {
                        const idNum = img.id;
                        (async () => {
                          try {
                            setSaving(true);
                            await apiDeleteSlider(idNum);
                            setSlider1((prev) =>
                              prev.filter(
                                (i) => !(isNumericId(i.id) && i.id === idNum)
                              )
                            );
                            setToast({
                              show: true,
                              msg: "Slider 1 image deleted",
                              variant: "success",
                            });
                          } catch (e: any) {
                            setToast({
                              show: true,
                              msg: e?.message || "Gagal hapus gambar",
                              variant: "error",
                            });
                          } finally {
                            setSaving(false);
                          }
                        })();
                      } else {
                        if (img.file && img.url?.startsWith("blob:"))
                          URL.revokeObjectURL(img.url);
                        setSlider1((prev) =>
                          prev.filter((i) => i.id !== img.id)
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Image
                  </button>
                </div>
              </figure>
            ))}
          </div>
          <input
            ref={slider1Input}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPickMany(e, setSlider1)}
          />
        </section>

        {/* Slider 2 */}
        <section className={card} aria-labelledby="slider2-title">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="slider2-title" className={sectionTitle}>
              Slider 2
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => pickFile(slider2Input)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                aria-label="Upload New Image"
              >
                <Plus className="h-4 w-4" /> Upload New Image
              </button>
              {slider2.some((s) => isNumericId(s.id)) && (
                <button
                  onClick={async () => {
                    const orders = slider2
                      .map((m, i) => {
                        const idNum = toNumericId(m.id);
                        return idNum !== null ? { id: idNum, sort: i } : null;
                      })
                      .filter(Boolean) as Array<{ id: number; sort: number }>;
                    if (!orders.length) return;

                    const idsOnly = orders.map((o) => o.id);
                    if (idsEqual(idsOnly, initialRef.current.slider2Ids))
                      return;

                    try {
                      setSaving(true);
                      await (reorderSliders as any)(GROUP2, orders);
                      setToast({
                        show: true,
                        msg: "Urutan slider 2 disimpan",
                        variant: "success",
                      });
                      initialRef.current.slider2Ids = idsOnly;
                    } catch (e: any) {
                      setToast({
                        show: true,
                        msg: e?.message || "Gagal simpan urutan slider 2",
                        variant: "error",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Save Order
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            {slider2.map((img) => (
              <figure
                key={img.id}
                className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 hover:scale-[1.01]"
              >
                <img
                  src={img.url}
                  alt={img.name || "slider"}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <div className="mt-2">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    aria-label={`Delete ${img.name || "image"}`}
                    onClick={() => {
                      if (isNumericId(img.id)) {
                        const idNum = img.id;
                        (async () => {
                          try {
                            setSaving(true);
                            await apiDeleteSlider(idNum);
                            setSlider2((prev) =>
                              prev.filter(
                                (i) => !(isNumericId(i.id) && i.id === idNum)
                              )
                            );
                            setToast({
                              show: true,
                              msg: "Slider 2 image deleted",
                              variant: "success",
                            });
                          } catch (e: any) {
                            setToast({
                              show: true,
                              msg: e?.message || "Gagal hapus gambar",
                              variant: "error",
                            });
                          } finally {
                            setSaving(false);
                          }
                        })();
                      } else {
                        if (img.file && img.url?.startsWith("blob:"))
                          URL.revokeObjectURL(img.url);
                        setSlider2((prev) =>
                          prev.filter((i) => i.id !== img.id)
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Image
                  </button>
                </div>
              </figure>
            ))}
          </div>
          <input
            ref={slider2Input}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPickMany(e, setSlider2)}
          />
        </section>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.msg}
        variant={toast.variant}
        onClose={() => setToast({ show: false, msg: "" })}
      />
    </div>
  );
}