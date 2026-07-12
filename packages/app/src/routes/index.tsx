import { useQuery } from "@tanstack/react-query";
import { useAppSetting } from "~/lib/use-app-setting";
import { getScriptsQuery } from "~/data/getScripts";
import { getOrdersQuery } from "~/data/getOrders";
import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { Package, ShoppingCart, CheckCircle } from "lucide-react";

export function HomePage() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const { data: scripts } = useQuery(getScriptsQuery);
  const { data: orders } = useQuery(getOrdersQuery);

  const totalScripts = scripts?.length ?? 0;
  const totalOrders = orders?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your scripts and orders.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Script
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeScript || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scripts Found
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalScripts}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
