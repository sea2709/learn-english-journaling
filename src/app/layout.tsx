import type { Metadata } from "next";
import { Courier_Prime, Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
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
        className={`${fraunces.variable} ${courierPrime.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
