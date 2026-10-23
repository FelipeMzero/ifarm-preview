import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "Encountered a script tag while rendering React component",
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  children?: React.ReactNode;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
