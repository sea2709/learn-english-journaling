import { createHmac, timingSafeEqual } from "node:crypto";

export type FacebookSignedRequestData = {
  algorithm: string;
  expires?: number;
  issued_at?: number;
  user_id: string;
};

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64");
}

/**
 * Parse and verify a Meta/Facebook signed_request (HMAC-SHA256).
 * @see https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback
 */
export function parseFacebookSignedRequest(
  signedRequest: string,
  appSecret: string
): FacebookSignedRequestData | null {
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [encodedSig, payload] = parts;

  let sig: Buffer;
  let data: FacebookSignedRequestData;
  try {
    sig = base64UrlDecode(encodedSig);
    data = JSON.parse(base64UrlDecode(payload).toString("utf8")) as FacebookSignedRequestData;
  } catch {
    return null;
  }

  if (!data?.user_id || typeof data.user_id !== "string") {
    return null;
  }

  const algorithm = (data.algorithm ?? "HMAC-SHA256").toUpperCase();
  if (algorithm !== "HMAC-SHA256") {
    return null;
  }

  const expectedSig = createHmac("sha256", appSecret)
    .update(payload)
    .digest();

  if (
    sig.length !== expectedSig.length ||
    !timingSafeEqual(sig, expectedSig)
  ) {
    return null;
  }

  return data;
}
