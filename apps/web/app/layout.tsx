import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "../components/ServiceWorker";

export const metadata: Metadata = {
  title: "MechMate AI",
  description: "Search a topic. Understand the formulas. Apply them with confidence.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black", title: "MechMate" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" }
};

export const viewport: Viewport = {
  themeColor: "#020409",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem("mechmate-theme")||""}catch(e){}`
          }}
        />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
