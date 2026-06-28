import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { cn } from "ui";
import { useAppSetting } from "../lib/use-app-setting";
import { getOrdersQuery } from "../data/getOrders/query";

export function ScriptDropdown() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const setActiveScript = useAppSetting((s) => s.setActiveScript);
  const { data: orders } = useQuery(getOrdersQuery);
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

  const selected = orders?.find((o) => o.product.id === activeScript);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <span className="truncate">{selected?.product.name ?? "Select script..."}</span>
        <ChevronDown
          className={cn("ml-2 h-3 w-3 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
          <button
            type="button"
            onClick={() => {
              setActiveScript(null);
              setOpen(false);
            }}
            className={cn(
              "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
              !activeScript && "bg-accent text-accent-foreground",
            )}
          >
            None
          </button>
          {orders?.map((o) => (
            <button
              key={o.product.id}
              type="button"
              onClick={() => {
                setActiveScript(o.product.id);
                setOpen(false);
              }}
              className={cn(
                "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                activeScript === o.product.id && "bg-accent text-accent-foreground",
              )}
            >
              {o.product.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
