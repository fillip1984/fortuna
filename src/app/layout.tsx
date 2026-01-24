import "~/styles/globals.css";

import type { Metadata } from "next";

import SideNav from "~/components/nav/SideNav";
import SignInView from "~/components/SignInView";
import TaskModal from "~/components/task/TaskModal";
import { AppContextProvider } from "~/context/AppContextProvider";
import { ThemeProvider } from "~/context/ThemeProvider";
import { getSession } from "~/server/auth/server";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "fortuna",
  description: "Simple task management app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <ThemeProvider
            attribute={"class"}
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {session?.user ? <SignedIn>{children}</SignedIn> : <SignInView />}
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

const SignedIn = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <AppContextProvider>
      <div className="relative flex h-screen overflow-hidden">
        <SideNav />

        <main className="grow">{children}</main>
        <TaskModal />
      </div>
    </AppContextProvider>
  );
};
