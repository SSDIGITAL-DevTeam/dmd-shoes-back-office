import { proxyJson } from "../../_lib/proxy";

export async function GET(req: Request) {
    // ke Laravel: GET /meta/pages (karena base = http://localhost:8000/api/v1)
    return proxyJson(req, "/meta/pages");
}
