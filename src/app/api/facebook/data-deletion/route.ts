import { NextResponse } from "next/server";
import { processFacebookDataDeletion } from "@/lib/data-deletion";
import { parseFacebookSignedRequest } from "@/lib/facebook-signed-request";

export async function POST(request: Request) {
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json(
      { error: "Facebook data deletion is not configured." },
      { status: 500 }
    );
  }

  let signedRequest: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const value = form.get("signed_request");
    signedRequest = typeof value === "string" ? value : null;
  } else if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      signed_request?: string;
    } | null;
    signedRequest = body?.signed_request ?? null;
  } else {
    const form = await request.formData().catch(() => null);
    const value = form?.get("signed_request");
    signedRequest = typeof value === "string" ? value : null;
  }

  if (!signedRequest) {
    return NextResponse.json(
      { error: "Missing signed_request." },
      { status: 400 }
    );
  }

  const parsed = parseFacebookSignedRequest(signedRequest, appSecret);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid signed_request." },
      { status: 400 }
    );
  }

  const { confirmationCode } = await processFacebookDataDeletion(
    parsed.user_id
  );

  const origin = new URL(request.url).origin;
  const url = `${origin}/deletion/${confirmationCode}`;

  return NextResponse.json({
    url,
    confirmation_code: confirmationCode,
  });
}
