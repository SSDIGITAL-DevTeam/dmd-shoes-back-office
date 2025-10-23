// services/homepage.service.ts
import api from "@/lib/fetching";

export type HomepagePayload = {
  hero?: { image_url: string | null; link?: string | null } | null;
  video?: { mode: "youtube" | "file" | null; url?: string | null; file_url?: string | null } | null;
  sliders?: Record<string, Array<{ id: number; image_url: string; sort: number }>>;
};

export async function getHomepage() {
  // via Next proxy -> Laravel /api/v1/homepage
  return api.get<{ status?: string; message?: string; data: HomepagePayload }>("/homepage");
}

/* ===== HERO ===== */
// Backend aslinya PUT, tapi kita kirim PATCH (proxy boleh map PATCH→PUT).
export async function updateHeroWithUrl(url: string, link?: string | null) {
  const body: any = { image_url: url };
  if (link != null) body.link = link;
  return api.put("/homepage/hero", body); // <-- PUT
}

export async function updateHeroWithFile(file: File, link?: string | null) {
  const fd = new FormData();
  fd.append("image_file", file);
  if (link != null) fd.append("link", link);
  return api.put("/homepage/hero", fd);   // <-- PUT
}

/* ===== VIDEO ===== */
// Backend aslinya PUT, tapi kita kirim PATCH (proxy boleh map PATCH→PUT).
export async function updateVideoYoutube(url: string) {
  return api.patch("/homepage/video", { mode: "youtube", url });
}
export async function updateVideoFile(file: File) {
  const fd = new FormData();
  fd.append("mode", "file");
  fd.append("file", file);
  return api.patch("/homepage/video", fd);
}
export async function deleteVideo() {
  return api.delete("/homepage/video");
}

/* ===== SLIDERS ===== */
// create tetap POST
export async function createSlider(
  group: string,
  data: { file?: File; url?: string },
  sort?: number
) {
  if (data.file) {
    const fd = new FormData();
    fd.append("group", group);
    fd.append("image_file", data.file);
    if (typeof sort === "number") fd.append("sort", String(sort));
    return api.post("/homepage/sliders", fd);
  }
  const body: any = { group, image_url: data.url };
  if (typeof sort === "number") body.sort = sort;
  return api.post("/homepage/sliders", body);
}

// update item slider memang PATCH
export async function updateSlider(
  id: number,
  data: { group?: string; sort?: number; file?: File; url?: string }
) {
  if (data.file) {
    const fd = new FormData();
    if (data.group) fd.append("group", data.group);
    fd.append("image_file", data.file);
    if (typeof data.sort === "number") fd.append("sort", String(data.sort));
    return api.patch(`/homepage/sliders/${id}`, fd);
  }
  const body: any = {};
  if (data.group) body.group = data.group;
  if (data.url) body.image_url = data.url;
  if (typeof data.sort === "number") body.sort = data.sort;
  return api.patch(`/homepage/sliders/${id}`, body);
}

export async function deleteSlider(id: number) {
  return api.delete(`/homepage/sliders/${id}`);
}

export async function reorderSliders(group: string, orders: Array<{ id: number; sort: number }>) {
  return api.post("/homepage/sliders/reorder", { group, orders });
}