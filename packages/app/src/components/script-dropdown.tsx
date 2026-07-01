import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { cn } from "ui";
import { useAppSetting } from "../lib/use-app-setting";
import { getScriptsQuery } from "../data/getScripts/query";

export function ScriptDropdown() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const setActiveScript = useAppSetting((s) => s.setActiveScript);
  const { data: orders } = useQuery(getScriptsQuery);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = orders?.find((o) => o.name === activeScript);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <span className="truncate">
          {selected?.name ? `${selected.name} (${selected.version})` : "Select script..."}
        </span>
        <ChevronDown
          className={cn("ml-2 h-3 w-3 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
          {orders?.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => {
                setActiveScript(o.name);
                setOpen(false);
              }}
              className={cn(
                "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                activeScript === o.name && "bg-accent text-accent-foreground",
              )}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
