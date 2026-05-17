import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "AI Recruiter | SHL Assessment Platform",
    template: "%s | AI Recruiter"
  },
  description: "Advanced AI-driven recruiter for SHL assessment recommendations and comparisons. Find the perfect assessment for your candidates with ease.",
  keywords: ["AI Recruiter", "SHL Assessments", "Assessment Recommendations", "Hiring AI", "Recruitment Automation"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Recruiter",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "AI Recruiter | SHL Assessment Platform",
    description: "Intelligent recommendations for SHL assessments. Streamline your hiring process.",
    type: "website",
    siteName: "AI Recruiter",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Recruiter | SHL Assessment Platform",
    description: "Intelligent recommendations for SHL assessments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-svh w-full flex flex-col overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Providers>
              {children}
            </Providers>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
