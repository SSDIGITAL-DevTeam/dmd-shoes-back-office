import api from "@/lib/fetching";

/** Envelope dasar dari BE */
export type Envelope<T> = { status?: string; message?: string; data?: T };

/** Bentuk payload GET /homepage dari BE */
export type HomepageData = {
  hero?: {
    image_url?: string | null;
    image?: string | null;
    link?: string | null;
  };
  video?: {
    mode?: "youtube" | "file" | null;
    url?: string | null;
    file_url?: string | null;
    file?: string | null;
  };
  sliders?:
    | Array<{
        id: number;
        group_key?: string;
        group?: string;
        image_url: string | null;
        image: string;
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
          image: string;
          title?: string | null;
          alt?: string | null;
          link?: string | null;
          sort: number;
        }>
      >;
};

export async function getHomepage() {
  return api.get<Envelope<HomepageData>>("/homepage");
}

/* =========================================================
   HERO
   ========================================================= */

export async function updateHeroWithFile(fd: FormData) {
  const out = new FormData();

  const file =
    (fd.get("image_file") as File | null) || (fd.get("image") as File | null);
  if (file) {
    out.append("image_file", file);
    out.append("image", file);
  }

  const link = fd.get("link");
  if (typeof link === "string") out.append("link", link);

  out.append("_method", "PUT");
  return api.post<Envelope<any>>("/homepage/hero", out);
}

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

/**
 * Update video dari URL YouTube atau mode lain.
 * Fleksibel: jika payload punya 'mode', gunakan; jika tidak, default 'youtube'.
 */
export async function updateVideoByYoutubeUrl(
  payload: { url: string; youtube_url?: string; mode?: string }
) {
  const mode = payload.mode || "youtube";

  return api.put<Envelope<any>>("/homepage/video", {
    mode,
    url: payload.url,
    youtube_url: payload.youtube_url ?? payload.url,
  });
}

/**
 * Upload video file memakai multipart.
 * Fleksibel: bisa menyertakan 'mode' dari luar (default 'file').
 */
export async function updateVideoByFile(fd: FormData) {
  const out = new FormData();

  const file =
    (fd.get("file") as File | null) || (fd.get("video") as File | null);
  if (file) {
    out.append("file", file);
    out.append("video", file);
  }

  // Mode fleksibel: ambil dari fd kalau ada, default 'file'
  const mode =
    (fd.get("mode") as string | null | undefined) && fd.get("mode") !== ""
      ? (fd.get("mode") as string)
      : "file";
  out.append("mode", mode);

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

export async function createSlider(fd: FormData) {
  const out = new FormData();

  const file =
    (fd.get("image_file") as File | null) || (fd.get("image") as File | null);
  if (file) {
    out.append("image_file", file);
    out.append("image", file);
  }

  ["group", "sort", "title", "alt", "link"].forEach((k) => {
    const v = fd.get(k);
    if (v != null) out.append(k, v as any);
  });

  return api.post<Envelope<any>>("/homepage/sliders", out);
}

export async function deleteSlider(id: number) {
  return api.delete<Envelope<any>>(`/homepage/sliders/${id}`);
}

type ReorderByOrders = {
  group?: string;
  orders: Array<{ id: number; sort: number }>;
};
type ReorderByIds = { group?: string; ids: number[] };

export async function reorderSliders(input: ReorderByOrders | ReorderByIds) {
  return api.post<Envelope<any>>("/homepage/sliders/reorder", input as any);
}