import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "ui";
import { useAppSetting } from "../lib/use-app-setting";
import { ThemeSwitcher } from "./theme-switcher";
import { ScriptDropdown } from "./script-dropdown";

export function Navbar() {
  const sidebarOpen = useAppSetting((s) => s.sidebarOpen);
  const toggleSidebar = useAppSetting((s) => s.toggleSidebar);

  const version = window.__TREK_CLI__?.App?.version;

  return (
    <header className="flex h-14 items-center justify-between border-b px-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
        <ScriptDropdown />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground">
          {version === "<%version%>" ? "dev" : "v" + version}
        </span>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
