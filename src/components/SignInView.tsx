"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";

export default function SignInView() {
  const [email, setEmail] = useState("fillip1984@gmail.com");
  const [password, setPassword] = useState("Fortis et liber!1");

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome to Fortuna</h1>
      <Button
        variant="link"
        onClick={() => signIn("google")}
        className="text-muted-foreground cursor-pointer"
      >
        Sign in with Google
      </Button>
      <hr />
      or
      <hr />
      <div className="my-4 flex w-1/3 flex-col gap-2">
        <h3>Sign in with email/password</h3>
        <Label className="text-muted-foreground">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Label className="text-muted-foreground">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          onClick={() => signIn("credentials", { email, password })}
          disabled={!email || !password}
          className="mt-4"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
