import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SoulRep — Gym Management System",
  description: "Modern gym management platform for owners, trainers, and members.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body className="variant-4 antialiased" style={{ fontFamily: "'Work Sans', sans-serif" }}>
        <Providers>{children}</Providers>
        <Script id="chatling-config" strategy="afterInteractive">
          {`
            window.chtlConfig = { chatbotId: "7234168646" };
          `}
        </Script>

        <Script
          src="https://chatling.ai/js/embed.js"
          data-id="7234168646"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
