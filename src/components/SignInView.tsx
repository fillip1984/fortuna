"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function SignInView() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome to Fortuna</h1>
      <Button
        variant="link"
        onClick={() => signIn("google")}
        className="text-muted-foreground cursor-pointer"
      >
        Please sign in to continue
      </Button>
    </div>
  );
}
