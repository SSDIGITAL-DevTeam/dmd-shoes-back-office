// services/homepage.service.ts
import api from "@/lib/fetching";

/** Envelope dasar dari BE */
export type Envelope<T> = { status?: string; message?: string; data?: T };

/** Bentuk payload GET /homepage dari BE */
export type HomepageData = {
  hero?: {
    image_url?: string | null; // URL publik (storage atau http/https)
    image?: string | null;     // raw path
    link?: string | null;
  };
  video?: {
    mode?: "youtube" | "file" | null;
    url?: string | null;       // untuk youtube
    file_url?: string | null;  // untuk file
    file?: string | null;      // raw path
  };
  // BE-mu ada yang bentuk array flat, ada juga yang dikelompokkan per group
  sliders?:
    | Array<{
        id: number;
        group_key?: string;
        group?: string;
        image_url: string | null;
        image: string | null;
        title?: string | null;
        alt?: string | null;
        link?: string | null;
        sort: number;
      }>
    | Record<
        string,
        Array<{
          id: number;
          image_url: string | null;
          image: string | null;
          title?: string | null;
          alt?: string | null;
          link?: string | null;
          sort: number;
        }>
      >;
};

export async function getHomepage() {
  // GET /api/homepage -> proxy -> Laravel /api/v1/homepage
  return api.get<Envelope<HomepageData>>("/homepage");
}

/* =========================================================
   HERO
   ========================================================= */

/**
 * Upload hero image memakai multipart.
 * PENTING: gunakan POST + _method=PUT supaya $_FILES terisi di Laravel.
 * Field yang didukung: image_file (utama) dan image (fallback).
 * Opsional: link.
 */
export async function updateHeroWithFile(fd: FormData) {
  const out = new FormData();

  // ambil file dari image_file atau image
  const file =
    (fd.get("image_file") as File | null) || (fd.get("image") as File | null);
  if (file) {
    // kirim dua-duanya untuk kompatibilitas controller
    out.append("image_file", file);
    out.append("image", file);
  }

  // teruskan field opsional lain (mis. link) jika ada
  const link = fd.get("link");
  if (typeof link === "string") out.append("link", link);

  // Laravel method override
  out.append("_method", "PUT");

  // Gunakan POST agar PHP/Laravel mengisi $_FILES
  return api.post<Envelope<any>>("/homepage/hero", out);
}

/** Update hero pakai URL (JSON), ini aman dengan PUT */
export async function updateHeroWithUrl(payload: {
  image_url: string;
  link?: string | null;
}) {
  return api.put<Envelope<any>>("/homepage/hero", {
    image_url: payload.image_url,
    link: payload.link ?? null,
  });
}

/* =========================================================
   VIDEO
   ========================================================= */

/** Set video dari URL YouTube (JSON). */
export async function updateVideoByYoutubeUrl(payload: { url: string }) {
  // Kirim keduanya agar kompatibel jika BE masih membaca youtube_url
  return api.put<Envelope<any>>("/homepage/video", {
    url: payload.url,
    youtube_url: payload.url,
  });
}

/**
 * Upload video file memakai multipart.
 * PENTING: gunakan POST + _method=PUT supaya $_FILES terisi di Laravel.
 * Field yang didukung: file (utama) dan video (fallback).
 */
export async function updateVideoByFile(fd: FormData) {
  const out = new FormData();

  const file =
    (fd.get("file") as File | null) || (fd.get("video") as File | null);
  if (file) {
    // kirim dua nama field untuk kompatibilitas
    out.append("file", file);
    out.append("video", file);
  }

  // Kalau ada metadata lain (mis. title, alt), ikutkan
  ["title", "alt"].forEach((k) => {
    const v = fd.get(k);
    if (typeof v === "string") out.append(k, v);
  });

  out.append("_method", "PUT");
  return api.post<Envelope<any>>("/homepage/video", out);
}

export async function deleteVideo() {
  return api.delete<Envelope<any>>("/homepage/video");
}

/* =========================================================
   SLIDERS
   ========================================================= */

/**
 * Buat slider baru (multipart).
 * Wajib: image_file (atau image), group, sort
 * Opsional: title, alt, link
 */
export async function createSlider(fd: FormData) {
  const out = new FormData();

  // Normalisasi file: terima image_file atau image
  const file =
    (fd.get("image_file") as File | null) || (fd.get("image") as File | null);
  if (file) {
    out.append("image_file", file);
    out.append("image", file); // fallback, jika controller membaca "image"
  }

  // Copy fields lain apa adanya
  ["group", "sort", "title", "alt", "link"].forEach((k) => {
    const v = fd.get(k);
    if (v != null) out.append(k, v as any);
  });

  return api.post<Envelope<any>>("/homepage/sliders", out);
}

export async function deleteSlider(id: number) {
  return api.delete<Envelope<any>>(`/homepage/sliders/${id}`);
}

/**
 * Reorder sliders (fleksibel).
 * Bisa dipanggil dengan:
 *   reorderSliders({ group: 'carousel1', orders: [{id, sort}, ...] })
 *   reorderSliders({ orders: [{id, sort}, ...] })
 *   reorderSliders({ ids: [1,2,3] })
 */
type ReorderByOrders = { group?: string; orders: Array<{ id: number; sort: number }> };
type ReorderByIds = { group?: string; ids: number[] };
export async function reorderSliders(input: ReorderByOrders | ReorderByIds) {
  // Kirim sesuai bentuk yang kamu pakai di server
  // (kebanyakan: { group, orders })
  return api.post<Envelope<any>>("/homepage/sliders/reorder", input as any);
}