"use client";

import { useState } from "react";
import { FaCircleNotch, FaGoogle } from "react-icons/fa";
import { authClient } from "~/server/auth/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function SignInView() {
  const socialProviders = [
    { label: "google", icon: <FaGoogle /> },
    // { label: "github", icon: <FaGithub /> },
  ];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const handleEmailSignIn = async () => {
    setEmailLoginLoading(true);
    // await authClient.signUp.email({
    //   email,
    //   password,
    //   name: "fillip1984",
    // });
    await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
      fetchOptions: {
        onError: (error) => {
          setEmailError(error.error.message);
        },
        onResponse: () => {
          setEmailLoginLoading(false);
        },
      },
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center pt-40">
      <div className="flex w-2/3 flex-col items-center justify-center gap-2">
        <h3 className="text-center text-2xl font-bold">Welcome to fortuna</h3>
        <p className="text-muted-foreground text-sm">
          This web application is by invitation only...
        </p>
        <div className="mt-8">
          {socialProviders.map((provider) => (
            <Button
              key={provider.label}
              onClick={() =>
                authClient.signIn.social({ provider: provider.label })
              }
            >
              {provider.icon}
              {provider.label.charAt(0).toUpperCase() + provider.label.slice(1)}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleEmailSignIn();
          }}
          className="flex flex-col gap-2"
        >
          {emailError && <p className="text-destructive">{emailError}</p>}

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <Button type="submit" className="w-full">
            {emailLoginLoading && <FaCircleNotch className="animate-spin" />}
            Sign in with Email
          </Button>
        </form>
      </div>
    </div>
  );
}
