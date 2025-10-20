import { proxyJson } from "../../../../../_lib/proxy";

export async function PATCH(req: Request, ctx: { params: { pageId: string; tagId: string } }) {
    return proxyJson(req, `/meta/pages/${ctx.params.pageId}/tags/${ctx.params.tagId}`);
}

export async function DELETE(req: Request, ctx: { params: { pageId: string; tagId: string } }) {
    return proxyJson(req, `/meta/pages/${ctx.params.pageId}/tags/${ctx.params.tagId}`);
}
