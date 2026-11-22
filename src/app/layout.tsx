import type { Metadata } from "next";
import { Inter, EB_Garamond, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "FormaCV — ATS-Friendly CV Builder",
  description:
    "Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${ebGaramond.variable} ${merriweather.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#09090B] font-sans">
        {children}
      </body>
    </html>
  );
}
