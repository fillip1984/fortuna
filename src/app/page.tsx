"use client";

import { useSession } from "next-auth/react";
import MainView from "~/components/MainView";
import SignInView from "~/components/SignInView";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return <SignInView />;
  } else {
    return <MainView />;
  }
}
