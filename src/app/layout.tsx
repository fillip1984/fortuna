import "~/styles/globals.css";

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import SideNav from "~/components/nav/SideNav";
import { AppContextProvider } from "~/context/AppContextProvider";
import { ThemeProvider } from "~/context/ThemeProvider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "fortuna",
  description: "Simple task management app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            <AppContextProvider>
              <ThemeProvider
                attribute={"class"}
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="relative flex h-screen overflow-hidden">
                  <SideNav />

                  <main className="flex-1">{children}</main>
                </div>
              </ThemeProvider>
            </AppContextProvider>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
