import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/calc-app" : "";
const siteUrl = isGithubPages
  ? "https://alejandro-llanganate.github.io/calc-app"
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Caja Ventas",
  description:
    "Registro de ventas simple: calculadora para el día a día y panel web para más detalle.",
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: [{ url: `${basePath}/favicon.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${basePath}/icons/icon-192.svg`, type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Caja Ventas",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Caja Ventas",
    description: "Calculadora de ventas para tu tienda",
    type: "website",
    locale: "es",
    images: [{ url: `${basePath}/icons/icon-512.svg` }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0078d4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full min-h-full bg-stone-50 text-stone-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
