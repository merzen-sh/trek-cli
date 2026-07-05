import { useQuery } from "@tanstack/react-query";
import { useAppSetting } from "../lib/use-app-setting";
import { getScriptsQuery } from "../data/getScripts/query";
import { getOrdersQuery } from "../data/getOrders/query";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "ui";
import { Download } from "lucide-react";
import { fieldLabel, isFieldVisible } from "../lib/labels";

export function OverviewPage() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const { data: scripts } = useQuery(getScriptsQuery);
  const { data: orders } = useQuery(getOrdersQuery);

  if (!activeScript) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a script from the navbar</p>
      </div>
    );
  }

  const script = scripts?.find((s) => s.name === activeScript);
  const order = orders?.find((o) => o.product.id === activeScript);
  const isInstalled = !!script;

  return (
    <div className="p-6 space-y-6">
      {!order && (
        <div className="rounded border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          Script &ldquo;{activeScript}&rdquo; not found in your orders.
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {order?.product?.thumbnail && (
            <img
              src={order.product.thumbnail}
              alt={order.product.name}
              className="w-16 h-16 rounded object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {order?.product?.name ?? activeScript}
            </h1>
            {order && (
              <p className="text-sm text-muted-foreground">
                Token:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {order.tokenKey}
                </code>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isInstalled ? "outline" : "secondary"}
            className={isInstalled ? "border-green-500 text-green-600" : ""}
          >
            {isInstalled ? "Installed" : "Not Installed"}
          </Badge>
        </div>
      </div>

      {!isInstalled && (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                This script is not installed in your workspace.
              </p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </CardContent>
        </Card>
      )}

      {isInstalled && script && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Version</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{script.version ?? "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Author</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{script.author ?? "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">fx_version</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{script.manifest.fx_version}</p>
              </CardContent>
            </Card>
          </div>

          {script.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{script.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">fxmanifest.lua</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {script.manifest.fields
                  .filter((f) => {
                    const key = Object.keys(f)[0];
                    return key && isFieldVisible(key);
                  })
                  .map((field, i) => {
                    const key = Object.keys(field)[0];
                    const value = field[key] as string | boolean | string[];
                    return (
                      <div key={i}>
                        <p className="text-xs text-muted-foreground mb-0.5">{fieldLabel(key)}</p>
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside text-sm space-y-0.5">
                            {value.map((v, j) => (
                              <li key={j} className="font-mono text-xs">
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-mono text-sm">{String(value)}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {script.manifest.games.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
