import type { Metadata } from "next";
import Link from "next/link";
import { getDataDeletionRequestByCode } from "@/lib/data-deletion";

type PageProps = {
  params: Promise<{ code: string }>;
};

export const metadata: Metadata = {
  title: "Data deletion status — English Journal",
  description: "Check the status of your English Journal data deletion request.",
  robots: { index: false, follow: false },
};

function statusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "failed":
      return "Needs attention";
    case "pending":
      return "In progress";
    default:
      return status;
  }
}

export default async function DataDeletionStatusPage({ params }: PageProps) {
  const { code } = await params;
  const confirmationCode = decodeURIComponent(code).trim();

  let request = null;
  let loadError: string | null = null;

  try {
    request = await getDataDeletionRequestByCode(confirmationCode);
  } catch {
    loadError =
      "We could not look up this request right now. Please try again later.";
  }

  return (
    <div className="min-h-screen paper-texture px-4 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <header className="mb-10">
          <Link
            href="/"
            className="font-display text-lg font-semibold text-ink-900 transition hover:text-ink-700"
          >
            English Journal
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold text-ink-900">
            Data deletion request
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Confirmation code:{" "}
            <span className="font-mono text-ink-600">{confirmationCode}</span>
          </p>
        </header>

        <div className="space-y-4 text-sm leading-relaxed text-ink-600">
          {loadError ? (
            <p className="rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-coral-800">
              {loadError}
            </p>
          ) : !request ? (
            <p>
              We could not find a deletion request with this confirmation code.
              Check that you opened the link from Facebook exactly as provided,
              or request deletion again from Facebook Settings → Apps and
              Websites.
            </p>
          ) : (
            <>
              <p>
                <span className="font-medium text-ink-800">Status:</span>{" "}
                {statusLabel(request.status)}
              </p>
              <p>{request.message}</p>
              <p className="text-ink-400">
                Received:{" "}
                {new Date(request.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {request.completedAt
                  ? ` · Updated: ${new Date(request.completedAt).toLocaleString(
                      undefined,
                      { dateStyle: "medium", timeStyle: "short" }
                    )}`
                  : null}
              </p>
            </>
          )}
        </div>

        <footer className="mt-12 border-t border-ink-200/60 pt-6 text-sm text-ink-500">
          <Link
            href="/"
            className="font-medium text-sage-700 underline-offset-2 hover:underline"
          >
            ← Back to English Journal
          </Link>
          {" · "}
          <Link
            href="/privacy"
            className="font-medium text-sage-700 underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
        </footer>
      </article>
    </div>
  );
}
