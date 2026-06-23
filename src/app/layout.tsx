import type { Metadata } from "next";
import { DM_Sans, Literata } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "English Journal — Learn by Writing",
  description:
    "Practice English through daily journaling with AI feedback on grammar, tone, and natural expression.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${literata.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
