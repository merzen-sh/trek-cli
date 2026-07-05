import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Settings,
  Home,
  Sliders,
  PanelLeftClose,
  AppWindow,
  FileJson,
  Palette,
} from "lucide-react";
import { useAppSetting } from "../lib/use-app-setting";
import { cn } from "ui";
import { SettingsDialog } from "./settings-dialog";

interface Resource {
  id: string;
  name: string;
  icon: typeof Home;
  menus: { label: string; to?: string; icon?: typeof Home }[];
}

const resources: Resource[] = [
  {
    id: "home",
    name: "Home",
    icon: Home,
    menus: [{ label: "Dashboard", to: "/" }],
  },
  {
    id: "config",
    name: "Configuration",
    icon: Sliders,
    menus: [
      { label: "Overview", to: "/overview", icon: AppWindow },
      { label: "Config Editor", to: "/config", icon: FileJson },
      { label: "Theme Editor", to: "/theme", icon: Palette },
    ],
  },
];

function SidebarContent({
  selected,
  onSelect,
  sidebarOpen,
  toggleSidebar,
  settingsOpen,
  setSettingsOpen,
}: {
  selected: string;
  onSelect: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}) {
  const active = resources.find((r) => r.id === selected);

  return (
    <>
      <aside className="flex w-14 flex-shrink-0 flex-col items-center border-r bg-background py-3">
        <div className="flex flex-col items-center gap-3 flex-1">
          {resources.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors",
                selected === r.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              title={r.name}
            >
              <r.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:rounded-lg hover:bg-accent hover:text-accent-foreground",
            settingsOpen && "rounded-lg bg-accent text-accent-foreground",
          )}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </aside>

      {selected !== "home" && (
        <aside
          className={cn(
            "bg-background border-r shrink-0 overflow-hidden transition-all duration-200",
            sidebarOpen ? "w-60" : "w-0",
          )}
        >
          {active && (
            <div className="w-60 shrink-0">
              <div className="flex h-14 items-center justify-between border-b px-4 text-sm font-semibold">
                <span>{active.name}</span>
                <button
                  onClick={toggleSidebar}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  title="Toggle sidebar"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
              <nav className="space-y-0.5 p-2">
                {active.menus.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.label}
                      to={m.to || "/"}
                      className="flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:hover:bg-primary/10 [&.active]:hover:text-primary font-medium transition-colors"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {m.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </aside>
      )}
    </>
  );
}

export function Sidebar() {
  const sidebarOpen = useAppSetting((s) => s.sidebarOpen);
  const setSidebarOpen = useAppSetting((s) => s.setSidebarOpen);
  const toggleSidebar = useAppSetting((s) => s.toggleSidebar);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { location } = useRouterState();
  const pathname = location.pathname;

  const selected =
    pathname.startsWith("/config") ||
    pathname.startsWith("/theme") ||
    pathname.startsWith("/overview")
      ? "config"
      : "home";

  const navigate = useNavigate();

  function handleSelect(id: string) {
    const resource = resources.find((r) => r.id === id);
    if (resource?.menus[0]?.to) {
      navigate({ to: resource.menus[0].to });
    }
    setSettingsOpen(false);
    if (!sidebarOpen) setSidebarOpen(true);
  }

  return (
    <>
      {/* Mobile overlay — starts below navbar so toggle stays reachable */}
      <div
        className={cn(
          "fixed inset-x-0 top-14 bottom-0 z-40 lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            sidebarOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "relative flex h-full transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <SidebarContent
            selected={selected}
            onSelect={handleSelect}
            sidebarOpen={true}
            toggleSidebar={() => setSidebarOpen(false)}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        </div>
      </div>

      {/* Desktop inline */}
      <div className="hidden lg:flex">
        <SidebarContent
          selected={selected}
          onSelect={handleSelect}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
        />
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
