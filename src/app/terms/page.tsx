import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service — English Journal",
  description:
    "The terms that govern your use of English Journal.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="July 15, 2026">
      <p>
        These Terms of Service (“Terms”) govern your access to and use of
        English Journal (the “App”). By creating an account or using the App,
        you agree to these Terms. If you do not agree, do not use the App.
      </p>

      <section className="space-y-3">
        <h2>1. The service</h2>
        <p>
          English Journal is a journaling tool for English learners. It lets
          you write entries paragraph by paragraph, request AI feedback on your
          writing, customize what the AI focuses on, upload images to entries,
          and save your work to your account.
        </p>
        <p>
          Features may change over time. We may add, modify, or remove
          functionality, and we may temporarily suspend the service for
          maintenance or security.
        </p>
      </section>

      <section className="space-y-3">
        <h2>2. Accounts</h2>
        <ul>
          <li>
            You must provide accurate account information and keep your login
            credentials secure.
          </li>
          <li>
            You are responsible for activity that occurs under your account.
          </li>
          <li>
            You must be at least 13 years old (or the minimum age required in
            your country) to use the App.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms or
            that we reasonably believe are being used in a harmful or abusive
            way.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>3. Your content</h2>
        <p>
          You retain ownership of the journal entries, images, and other
          content you create in the App (“Your Content”). By using the App, you
          grant us a limited license to host, store, process, and display Your
          Content solely as needed to operate and improve the service — for
          example, saving entries, rendering images, and generating AI feedback
          when you request it.
        </p>
        <p>
          You are responsible for Your Content. Do not upload or write content
          that is illegal, infringing, harmful, or that you do not have the
          right to share.
        </p>
      </section>

      <section className="space-y-3">
        <h2>4. AI feedback</h2>
        <p>
          AI analysis is provided for learning and writing practice. Suggestions,
          scores, and polished versions may be incomplete, inaccurate, or
          unsuitable for your situation. English Journal is not a substitute for
          professional language instruction, translation services, or academic
          or legal advice.
        </p>
        <p>
          When you request analysis, relevant text is processed by third-party
          AI providers as described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the App for unlawful purposes</li>
          <li>
            Attempt to access other users’ accounts or data, or probe, scrape,
            or overload the service
          </li>
          <li>
            Reverse engineer or interfere with the App except where allowed by
            law
          </li>
          <li>
            Abuse AI features, feedback channels, or storage in ways that harm
            the service or other users
          </li>
          <li>
            Misrepresent your identity or affiliation when using the App
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>6. Third-party services</h2>
        <p>
          The App relies on third-party services such as authentication and
          hosting providers and AI providers. Those services are subject to their
          own terms and privacy policies. We are not responsible for
          third-party services we do not control.
        </p>
      </section>

      <section className="space-y-3">
        <h2>7. Availability and limits</h2>
        <p>
          We strive to keep the App available, but we do not guarantee
          uninterrupted or error-free operation. Storage and AI usage may be
          subject to reasonable limits (for example, a maximum number of saved
          entries per account).
        </p>
      </section>

      <section className="space-y-3">
        <h2>8. Disclaimers</h2>
        <p>
          The App is provided “as is” and “as available,” without warranties of
          any kind, whether express or implied, including warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement, to the fullest extent permitted by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, English Journal and its
          operators will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of data, profits, or
          opportunities arising from your use of the App. Our total liability
          for any claim relating to the App will not exceed the greater of (a)
          the amount you paid us to use the App in the twelve months before the
          claim, or (b) zero if the App is provided free of charge.
        </p>
      </section>

      <section className="space-y-3">
        <h2>10. Termination</h2>
        <p>
          You may stop using the App at any time. We may suspend or end access
          if you violate these Terms or if we discontinue the service. Sections
          that by their nature should survive termination (including ownership,
          disclaimers, and limitations of liability) will continue to apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2>11. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will
          update the “Last updated” date on this page. Continued use of the App
          after changes means you accept the updated Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2>12. Contact</h2>
        <p>
          Questions about these Terms can be sent through the in-app{" "}
          <strong className="font-medium text-ink-800">Send feedback</strong>{" "}
          feature after you sign in. You can also review our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
