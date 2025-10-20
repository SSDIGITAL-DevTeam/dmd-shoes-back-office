import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

function passthrough(res: Response) {
    const ct = res.headers.get("content-type") || "application/json";
    return res.clone().text().then(txt =>
        new Response(txt, { status: res.status, headers: { "content-type": ct } })
    );
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    ensureEnvOrThrow();
    const upstream = await fetch(makeApiUrl(`articles/${params.id}/force`), {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Cookie: req.headers.get("cookie") ?? "",
            Authorization: req.headers.get("authorization") ?? "",
            "X-Requested-With": "XMLHttpRequest",
        },
    });
    return passthrough(upstream);
}
