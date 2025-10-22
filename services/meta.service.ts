// services/meta.service.ts
import { apiGet, apiSend } from "@/lib/api/client";

/** =======================
 *  Types
 *  ======================= */
export type ItemBase = {
    id: number;
    status?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
};

export type ListMeta = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
};

export type ListResponse<T> = {
    status: string;
    message?: string;
    data: T[];
    meta: ListMeta;
};

export type DetailResponse<T> = {
    status: string;
    message?: string;
    data: T;
};

export type MetaPage = {
    id: number;
    name: string;
    slug: string;
};

export type MetaTagItem = ItemBase & {
    page_id: number;
    locale: "id" | "en";
    attr: "name" | "property" | "http-equiv" | "charset";
    identifier: string;               // e.g. description, og:title
    content: string | null;
    is_active: boolean;
    sort_order: number;
};

// Payloads
export type CreateMetaTagPayload = {
    locale?: "id" | "en";             // default: id (di BE)
    attr: "name" | "property" | "http-equiv" | "charset";
    identifier: string;
    content?: string | null;
    is_active?: boolean;
    sort_order?: number;
};

export type UpdateMetaTagPayload = Partial<CreateMetaTagPayload>;

/** =======================
 *  Pages
 *  ======================= */

// GET list pages (public)
export async function getPages(): Promise<{ status: string; message?: string; data: MetaPage[] }> {
    // Proxy Next: /api/meta/pages  -> Laravel: /api/v1/meta/pages
    return apiGet(`/api/meta/pages`);
}

/** =======================
 *  Tags (per page)
 *  ======================= */

// GET meta tags of a page (admin list) — support locale filter & pagination default by BE
export async function getPageTags(
    pageId: number,
    params: { locale?: "id" | "en"; page?: number; per_page?: number } = {}
): Promise<ListResponse<MetaTagItem> | { status: string; message?: string; data: MetaTagItem[]; meta?: ListMeta }> {
    const { locale, page, per_page } = params;
    return apiGet(`/api/meta/pages/${pageId}/tags`, {
        ...(locale ? { locale } : {}),
        ...(page ? { page } : {}),
        ...(per_page ? { per_page } : {}),
    });
}

// POST create tag (admin)
export async function createTag(
    pageId: number,
    payload: CreateMetaTagPayload
): Promise<DetailResponse<MetaTagItem> | { status: string; message?: string; data?: MetaTagItem }> {
    return apiSend(`/api/meta/pages/${pageId}/tags`, "POST", payload);
}

// PATCH update tag (admin)
export async function updateTag(
    pageId: number,
    tagId: number,
    payload: UpdateMetaTagPayload
): Promise<DetailResponse<MetaTagItem> | { status: string; message?: string; data?: MetaTagItem }> {
    return apiSend(`/api/meta/pages/${pageId}/tags/${tagId}`, "PATCH", payload);
}

// DELETE tag (admin)
export async function deleteTag(
    pageId: number,
    tagId: number
): Promise<{ status: string; message?: string }> {
    return apiSend(`/api/meta/pages/${pageId}/tags/${tagId}`, "DELETE");
}
