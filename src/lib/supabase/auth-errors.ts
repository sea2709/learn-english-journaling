/** True when the browser/server holds a dead or rotated Supabase refresh token. */
export function isStaleAuthError(
  error: { code?: string; message?: string } | null | undefined
) {
  if (!error) return false;
  return (
    error.code === "refresh_token_not_found" ||
    error.code === "refresh_token_already_used" ||
    error.code === "session_not_found" ||
    error.code === "session_expired" ||
    /refresh token/i.test(error.message ?? "")
  );
}
