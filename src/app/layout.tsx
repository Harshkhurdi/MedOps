import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Providers from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "MedOps | Medical equipment operations",
  description:
    "Private tender, delivery, maintenance and receivables management",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
