import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "RouteSense — Resilient Logistics Platform",
  description:
    "Dynamic supply chain optimization powered by Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            marginLeft: "240px",
            minHeight: "100vh",
            padding: "28px 32px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
