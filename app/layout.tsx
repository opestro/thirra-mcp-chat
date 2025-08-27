import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ChatSidebar } from "@/components/chat-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { BotIdClient } from "botid/client";
import { Inspector } from "react-dev-inspector";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://therra.ai"),
  title: "Thirra.ai",
  description:
    "Thirra.ai is your friend Ai assistant.",
  openGraph: {
    siteName: "Thirra.ai",
    url: "https://mcpchat.thirra.ai",
    images: [
      {
        url: "https://mcpchat.thirra.ai/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thirra.ai",
    description:
      "Thirra.ai is your friend Ai assistant.",
    images: ["https://mcpchat.thirra.ai/twitter-image.png"],
  },
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
          href="https://fonts.googleapis.com/css2?family=Zain:wght@200;300;400;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        <BotIdClient
          protect={[
            {
              path: "/api/chat",
              method: "POST",
            },
          ]}
        />
      </head>
      <body className={`${montserrat.variable}`}>
        <Inspector>
          <Providers>
            <div className="flex h-dvh w-full">
              <ChatSidebar />
              <main className="flex-1 flex flex-col relative">
                <div className="absolute top-4 left-4 z-50">
                  <SidebarTrigger>
                    <button className="flex items-center justify-center h-8 w-8 bg-muted hover:bg-accent rounded-md transition-colors">
                      <Menu className="h-4 w-4" />
                    </button>
                  </SidebarTrigger>
                </div>
                <div className="flex-1 flex justify-center">{children}</div>
              </main>
            </div>
          </Providers>

          <Analytics />
          <SpeedInsights />
        </Inspector>
      </body>
    </html>
  );
}
