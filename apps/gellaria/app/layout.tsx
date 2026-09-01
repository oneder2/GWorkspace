import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gellaria — GWorkspace 空间展览",
  description: "进入 GWorkspace 的空间展览层，在三维展馆中探索项目、写作与回声。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Gellaria · GWorkspace Explore",
    description: "GWorkspace 中可被抵达、探索并留下轻微生态痕迹的空间展览。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#101d24",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
