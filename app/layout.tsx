import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://industry-investment-research-agent.hust-qqh.chatgpt.site"),
  title: "产业投资研究 Agent｜真实研究工作台",
  description: "创建任意产业研究任务，上传内部材料，实时查看进度，并直接生成产业数据库与可编辑PPTX。",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    title: "产业投资研究 Agent",
    description: "任意产业研究、内部材料、实时进度、数据库与PPTX自动生成。",
    images: [{ url: "https://industry-investment-research-agent.hust-qqh.chatgpt.site/og.png", width: 1536, height: 1024, alt: "产业投资研究 Agent 证据链" }],
  },
  twitter: { card: "summary_large_image", title: "产业投资研究 Agent", description: "真实产业研究工作台", images: ["https://industry-investment-research-agent.hust-qqh.chatgpt.site/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
