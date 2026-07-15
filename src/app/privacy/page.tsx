import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — English Journal",
  description:
    "How English Journal collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="July 15, 2026">
      <p>
        This Privacy Policy explains how English Journal (“we,” “us,” or “the
        App”) collects, uses, and shares information when you use our service.
        By using English Journal, you agree to this policy.
      </p>

      <section className="space-y-3">
        <h2>1. Information we collect</h2>
        <p>We may collect the following information:</p>
        <ul>
          <li>
            <strong className="font-medium text-ink-800">Account information</strong>{" "}
            — email address, optional display name, and authentication details
            when you sign up with email or a social provider (such as Google or
            Facebook).
          </li>
          <li>
            <strong className="font-medium text-ink-800">Journal content</strong>{" "}
            — entry titles, paragraph text, AI analysis results you request, and
            images you upload to entries.
          </li>
          <li>
            <strong className="font-medium text-ink-800">Preferences</strong> —
            settings such as check-focus areas and optional learning goals.
          </li>
          <li>
            <strong className="font-medium text-ink-800">Feedback you send</strong>{" "}
            — messages submitted through the in-app feedback form, including any
            contact note you choose to include.
          </li>
          <li>
            <strong className="font-medium text-ink-800">Usage and technical data</strong>{" "}
            — information needed to operate the service securely (for example,
            session cookies and basic request metadata).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>2. How we use your information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide, maintain, and improve English Journal</li>
          <li>Authenticate your account and sync your entries across devices</li>
          <li>
            Generate AI writing feedback when you request paragraph checks or
            full-entry reviews
          </li>
          <li>Store and display entry images you upload</li>
          <li>Respond to feedback and support requests</li>
          <li>Protect the service against misuse and ensure security</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>3. AI processing</h2>
        <p>
          When you use Check or full-entry Feedback, the text you submit for
          analysis is sent to a third-party AI provider (such as Google Gemini
          or OpenAI, depending on our configuration) to generate suggestions
          and scores. Do not include sensitive personal information in journal
          text you send for analysis if you are not comfortable sharing it with
          those providers under their own policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2>4. How we store and protect data</h2>
        <p>
          Account data, journal entries, preferences, and feedback are stored
          using Supabase (authentication, database, and private storage for
          entry images). Access is restricted with authentication and row-level
          security so users can only access their own data. Session cookies are
          used to keep you signed in.
        </p>
        <p>
          No method of transmission or storage is completely secure. We take
          reasonable measures to protect your information, but we cannot
          guarantee absolute security.
        </p>
      </section>

      <section className="space-y-3">
        <h2>5. Sharing of information</h2>
        <p>We share information only as needed to operate the App, including:</p>
        <ul>
          <li>
            <strong className="font-medium text-ink-800">Infrastructure providers</strong>{" "}
            — such as Supabase for auth, database, and file storage
          </li>
          <li>
            <strong className="font-medium text-ink-800">AI providers</strong> —
            when you request writing analysis, as described above
          </li>
          <li>
            <strong className="font-medium text-ink-800">Legal requirements</strong>{" "}
            — if we are required to disclose information by law or to protect
            rights, safety, or the integrity of the service
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section className="space-y-3">
        <h2>6. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies as needed for authentication
          and to keep your session active. These are essential for signed-in
          features of the App.
        </p>
      </section>

      <section className="space-y-3">
        <h2>7. Data retention and your choices</h2>
        <p>
          We retain your account data and journal content while your account is
          active. You can edit or delete individual journal entries in the App.
          If you want your account deleted, contact us through the in-app Send
          feedback feature (or the contact method we publish) and we will
          process the request within a reasonable time, subject to any legal
          retention obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2>8. Children’s privacy</h2>
        <p>
          English Journal is not directed to children under 13, and we do not
          knowingly collect personal information from children under 13. If you
          believe a child has provided us with personal information, please
          contact us so we can take appropriate action.
        </p>
      </section>

      <section className="space-y-3">
        <h2>9. International users</h2>
        <p>
          The App may be hosted and processed in countries other than where you
          live. By using English Journal, you understand that your information
          may be transferred to and processed in those locations.
        </p>
      </section>

      <section className="space-y-3">
        <h2>10. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will update the “Last updated” date at the top of this page. Continued
          use of the App after changes means you accept the updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>11. Contact</h2>
        <p>
          Questions about this Privacy Policy can be sent through the in-app{" "}
          <strong className="font-medium text-ink-800">Send feedback</strong>{" "}
          feature after you sign in. You can also review our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
