// services/homepage.service.ts
import api from "@/lib/fetching";

export type LangText = { id?: string; en?: string };
export type Envelope<T> = { status?: string; message?: string; data?: T };

export type HeroPayloadByUrl = {
  title?: LangText;
  subtitle?: LangText;
  button_text?: LangText;
  button_link?: string | null;
  image_url?: string | null;
};

export async function getHomepage() {
  return api.get("/homepage"); // GET /api/homepage -> proxy -> Laravel /homepage
}

/** ===== HERO ===== */
// Update hero pakai URL (JSON)
export async function updateHeroWithUrl(payload: HeroPayloadByUrl) {
  return api.put("/homepage/hero", payload);
}

// Update hero pakai file (FormData)
export async function updateHeroWithFile(fd: FormData) {
  // fd bisa berisi: title[id], title[en], subtitle[id], subtitle[en], button_text[id], button_text[en], button_link, image (File)
  return api.put("/homepage/hero", fd);
}

/** ===== VIDEO ===== */
export async function updateVideoByYoutubeUrl(payload: { youtube_url: string }) {
  return api.put("/homepage/video", payload);
}

export async function updateVideoByFile(fd: FormData) {
  // fd: { video: File }
  return api.put("/homepage/video", fd);
}

export async function deleteVideo() {
  return api.delete("/homepage/video");
}

/** ===== SLIDERS ===== */
export type SliderItem = {
  id: number;
  title?: LangText;
  subtitle?: LangText;
  button_text?: LangText;
  button_link?: string | null;
  image_url?: string | null;
  order?: number;
  status?: boolean;
};

export async function listSliders() {
  return api.get("/homepage/sliders"); // { data: SliderItem[], ... }
}

export async function createSlider(fdOrJson: FormData | Record<string, any>) {
  // boleh FormData (image file) atau JSON (pakai image_url)
  return api.post("/homepage/sliders", fdOrJson);
}

export async function updateSlider(id: number, fdOrJson: FormData | Record<string, any>) {
  return api.patch(`/homepage/sliders/${id}`, fdOrJson);
}

export async function deleteSlider(id: number) {
  return api.delete(`/homepage/sliders/${id}`);
}

export async function reorderSliders(payload: { ids: number[] }) {
  // contoh payload backend umum: { ids: [3,1,2] } urutan baru
  return api.post("/homepage/sliders/reorder", payload);
}