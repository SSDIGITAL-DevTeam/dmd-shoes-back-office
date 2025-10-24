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
  sliders?: Array<{
    id: number;
    group_key: string;
    image_url: string | null;
    image: string | null;
    title?: string | null;
    alt?: string | null;
    link?: string | null;
    sort: number;
  }>;
};

export async function getHomepage() {
  // GET /api/homepage -> proxy -> Laravel /api/v1/homepage
  return api.get<Envelope<HomepageData>>("/homepage");
}

/** ================== HERO ================== */

// Update hero pakai file (multipart): field HARUS `image_file`, opsional `link`
export async function updateHeroWithFile(fd: FormData) {
  // Normalisasi: bila ada 'image' dari UI lama, ganti ke 'image_file'
  if (fd.has("image") && !fd.has("image_file")) {
    const val = fd.get("image") as File;
    fd.delete("image");
    if (val) fd.set("image_file", val);
  }
  return api.put<Envelope<any>>("/homepage/hero", fd);
}

// Update hero pakai URL (JSON): { image_url: "...", link?: "..." }
export async function updateHeroWithUrl(payload: { image_url: string; link?: string | null }) {
  return api.put<Envelope<any>>("/homepage/hero", payload);
}

/** ================== VIDEO ================== */

// Pakai URL YouTube: { url: "https://..." }
export async function updateVideoByYoutubeUrl(payload: { url: string }) {
  return api.put<Envelope<any>>("/homepage/video", payload);
}

// Upload file: multipart dengan field HARUS `file`
export async function updateVideoByFile(fd: FormData) {
  // Normalisasi: kalau UI lama mengirim 'video', map ke 'file'
  if (fd.has("video") && !fd.has("file")) {
    const val = fd.get("video") as File;
    fd.delete("video");
    if (val) fd.set("file", val);
  }
  return api.put<Envelope<any>>("/homepage/video", fd);
}

export async function deleteVideo() {
  return api.delete<Envelope<any>>("/homepage/video");
}

/** ================== SLIDER ================== */

export async function createSlider(fd: FormData) {
  // Normalisasi: pastikan file = `image_file`, wajib ada `group`, `sort`
  if (fd.has("image") && !fd.has("image_file")) {
    const val = fd.get("image") as File;
    fd.delete("image");
    if (val) fd.set("image_file", val);
  }
  return api.post<Envelope<any>>("/homepage/sliders", fd);
}

export async function deleteSlider(id: number) {
  return api.delete<Envelope<any>>(`/homepage/sliders/${id}`);
}

export async function reorderSliders(orders: Array<{ id: number; sort: number }>) {
  return api.post<Envelope<any>>("/homepage/sliders/reorder", { orders });
}