"use client";

import { useTheme } from "next-themes";

import { Moon, Sun } from "lucide-react";
import { GrSystem } from "react-icons/gr";
import { Button } from "~/components/ui/button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const handleThemeToggle = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "system";
      return "light";
    });
  };

  return (
    <Button
      onClick={handleThemeToggle}
      variant="outline"
      size="icon"
      className="absolute top-4 right-4 md:right-8 md:bottom-8"
    >
      {theme === "light" ? <Sun /> : theme === "dark" ? <Moon /> : <GrSystem />}
    </Button>
  );
}
