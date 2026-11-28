import type { Metadata } from "next";
import { Inter, Roboto, Merriweather } from "next/font/google";
import { COLOR_SCHEME_INIT_SCRIPT } from "@/lib/color-scheme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  preload: false,
  variable: "--font-roboto",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  preload: false,
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "Craftfolio — ATS CV Builder",
  description:
    "Kualitas tipografi sekelas LaTeX, semudah mengisi Google Form.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: "/logo.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable} ${merriweather.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-ui-canvas text-ui-text font-sans">
        {children}
      </body>
    </html>
  );
}
