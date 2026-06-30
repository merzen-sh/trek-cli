import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { useAppSetting } from "../lib/use-app-setting";
import { Navbar } from "../components/navbar";
import { Sidebar } from "../components/sidebar";
import { PinAuth } from "../components/pin-auth";
import { resolveTheme, applyThemeSmooth } from "../lib/theme-utils";

export function RootLayout() {
  const theme = useAppSetting((s) => s.theme);

  useEffect(() => {
    applyThemeSmooth(resolveTheme(theme));
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => applyThemeSmooth(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <PinAuth>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </PinAuth>
  );
}
