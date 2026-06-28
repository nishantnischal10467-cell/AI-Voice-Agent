import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "AI Voice Agent",
    template: "%s | AI Voice Agent",
  },
  description: "A production-ready voice RAG assistant for PDF-backed support conversations.",
  applicationName: "AI Voice Agent",
  openGraph: {
    title: "AI Voice Agent",
    description: "Upload documentation, ask questions, and receive grounded spoken answers.",
    type: "website",
    url: "/",
    siteName: "AI Voice Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agent",
    description: "PDF-grounded chat and voice playback powered by a FastAPI AI service.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#147177",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${mono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
