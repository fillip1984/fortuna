import "~/styles/globals.css";

import type { Metadata } from "next";
import SideNav from "~/components/nav/SideNav";
import { AppContextProvider } from "~/context/AppContextProvider";
import { ThemeProvider } from "~/context/ThemeProvider";
import { TRPCReactProvider } from "~/trpc/react";
import TaskModal from "~/components/task/TaskModal";

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
                <TaskModal/>
              </div>
            </ThemeProvider>
          </AppContextProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
