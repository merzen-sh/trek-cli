import { useState } from "react";
import { Button } from "ui";
import { Loader2, Key } from "lucide-react";
import { apiFetch } from "../lib/api";

export function OrderTokenButton({
  onSelect,
  disabled,
}: {
  onSelect: (token: string) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch("/external/api/orders");
      if (!res.ok) throw res;
      const json: {
        orders: { id: string; tokenKey: string; active: boolean }[];
      } = await res.json();
      const activeOrder = json.orders.find((o) => o.active);
      if (activeOrder) {
        onSelect(activeOrder.tokenKey);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || loading}
      onClick={handleClick}
      className="h-8 px-2 text-xs"
      title={error ? "No active order found" : "Fill from active order"}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
    </Button>
  );
}
