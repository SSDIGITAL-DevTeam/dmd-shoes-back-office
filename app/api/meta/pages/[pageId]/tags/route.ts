import { proxyJson } from "../../../../_lib/proxy";

export async function GET(req: Request, ctx: { params: { pageId: string } }) {
    return proxyJson(req, `/meta/pages/${ctx.params.pageId}/tags`);
}

export async function POST(req: Request, ctx: { params: { pageId: string } }) {
    return proxyJson(req, `/meta/pages/${ctx.params.pageId}/tags`);
}
