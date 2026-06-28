import { useState, type ReactNode } from "react";
import { hasPin, setPin } from "../lib/api";

export function PinAuth({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get("pin");
    if (pin) {
      setPin(pin);
      const url = new URL(window.location.href);
      url.searchParams.delete("pin");
      window.history.replaceState({}, "", url.pathname + url.search);
      return true;
    }
    return hasPin();
  });

  if (!authorized) {
    return <PinEntry onAuthorized={() => setAuthorized(true)} />;
  }

  return <>{children}</>;
}

function PinEntry({ onAuthorized }: { onAuthorized: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    const res = await fetch("/api/check-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    if (res.ok) {
      setPin(value);
      onAuthorized();
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
        <div className="p-3 rounded-full bg-muted">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Dashboard Access</h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit PIN shown in your terminal when you started the server.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            autoFocus
            placeholder="000000"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-40 h-12 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-xs text-destructive">Wrong PIN. Check your terminal.</p>}
          <button
            type="submit"
            disabled={value.length !== 6}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
