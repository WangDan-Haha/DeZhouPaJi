import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "朋友德州扒鸡",
  description: "朋友局实时牌桌工具，仅供娱乐计分使用"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
