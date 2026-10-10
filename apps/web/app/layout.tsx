import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MechMate AI",
  description: "Search a topic. Understand the formulas. Apply them with confidence."
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
      </body>
    </html>
  );
}
