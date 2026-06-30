import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasPin, getPin, setPin, clearPin } from "../lib/api";
import { authQuery, authKeys } from "../data/getAuth";

export function PinAuth({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get("pin");
    if (urlPin) {
      setPin(urlPin);
      const url = new URL(window.location.href);
      url.searchParams.delete("pin");
      window.history.replaceState({}, "", url.pathname + url.search);
      return urlPin;
    }
    return hasPin() ? getPin() : null;
  });

  const queryClient = useQueryClient();
  const { data: authStatus, isPending } = useQuery(authQuery(pin ?? ""));

  const retry = () =>
    queryClient.invalidateQueries({ queryKey: authKeys.status(pin ?? "") });

  const onPinEntered = (enteredPin: string) => {
    setPin(enteredPin);
    setPinState(enteredPin);
  };

  if (!pin) {
    return <PinEntry onAuthorized={onPinEntered} />;
  }

  if (isPending) {
    return <Loading />;
  }

  if (authStatus === "wrong-pin") {
    clearPin();
    setPinState(null);
    return null;
  }

  if (authStatus === "no-session") {
    return <EntryPoint onRetry={retry} />;
  }

  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}

function EntryPoint({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-4">
        <div className="p-3 rounded-full bg-muted">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Not Authenticated</h2>
        <p className="text-sm text-muted-foreground">
          You need to log in before using the dashboard. Run the following command in your terminal:
        </p>
        <code className="rounded bg-muted px-4 py-2 text-sm font-mono">trek login</code>
        <p className="text-xs text-muted-foreground">
          After logging in, restart the server and click the button below.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Check again
        </button>
      </div>
    </div>
  );
}

function PinEntry({ onAuthorized }: { onAuthorized: (pin: string) => void }) {
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
      onAuthorized(value);
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
