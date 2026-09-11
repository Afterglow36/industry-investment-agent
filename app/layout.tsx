import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://industry-investment-research-agent.prime-thyme-8533.chatgpt.site"),
  title: "产业投资研究 Agent｜可追溯的四图五清单研究",
  description: "面向地方国资、产业集团、园区与基金的可复用产业投资研究驾驶舱。",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    title: "产业投资研究 Agent",
    description: "让每一条产业判断，都能回到证据。",
    images: [{ url: "https://industry-investment-research-agent.prime-thyme-8533.chatgpt.site/og.png", width: 1536, height: 1024, alt: "产业投资研究 Agent 证据链" }],
  },
  twitter: { card: "summary_large_image", title: "产业投资研究 Agent", description: "让每一条产业判断，都能回到证据。", images: ["https://industry-investment-research-agent.prime-thyme-8533.chatgpt.site/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
