import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Plus, Palette, Shield } from "lucide-react";
import { cn, Card, CardHeader, CardTitle, CardContent, Button, Input } from "ui";
import { useAppSetting } from "~/lib/use-app-setting";
import { getAllowedIpsQuery } from "~/data/getAllowedIps";
import { useAddAllowedIp, useDeleteAllowedIp } from "~/data/saveAllowedIps";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type SettingsTab = "appearance" | "network-access";

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const theme = useAppSetting((s) => s.theme);
  const setTheme = useAppSetting((s) => s.setTheme);

  const { data: ipsData } = useQuery(getAllowedIpsQuery);
  const addIp = useAddAllowedIp();
  const deleteIp = useDeleteAllowedIp();

  const [newIp, setNewIp] = useState("");

  if (!open) return null;

  const handleAddIp = () => {
    const trimmed = newIp.trim();
    if (!trimmed) return;
    addIp.mutate(trimmed, { onSuccess: () => setNewIp("") });
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof Palette }[] = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "network-access", label: "Network Access", icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-4xl h-[500px] bg-background border rounded-2xl shadow-xl overflow-hidden">
        <div className="w-[25%] border-r bg-muted/30 p-4">
          <div className="text-sm font-semibold mb-4">Settings</div>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="w-[75%] p-6 flex flex-col gap-4 overflow-auto">
          {activeTab === "appearance" && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="text-sm text-muted-foreground">
                  Customize how the application looks.
                </p>
              </div>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Theme Mode</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-lg border bg-card text-xs hover:bg-accent transition-all",
                        theme === "light" && "border-primary ring-1 ring-primary",
                      )}
                    >
                      <div className="w-full h-14 bg-white border rounded-md p-1.5 flex flex-col gap-1 shadow-sm">
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-primary rounded w-full mt-auto flex items-center justify-center text-[8px] text-primary-foreground">
                          Button
                        </div>
                      </div>
                      <span className="font-medium">Light</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-lg border bg-card text-xs hover:bg-accent transition-all",
                        theme === "dark" && "border-primary ring-1 ring-primary",
                      )}
                    >
                      <div className="w-full h-14 bg-neutral-950 border rounded-md p-1.5 flex flex-col gap-1 shadow-sm">
                        <div className="h-2 bg-neutral-800 rounded w-3/4" />
                        <div className="h-2 bg-neutral-800 rounded w-1/2" />
                        <div className="h-4 bg-primary rounded w-full mt-auto flex items-center justify-center text-[8px] text-primary-foreground">
                          Button
                        </div>
                      </div>
                      <span className="font-medium">Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-lg border bg-card text-xs hover:bg-accent transition-all",
                        theme === "system" && "border-primary ring-1 ring-primary",
                      )}
                    >
                      <div className="w-full h-14 bg-[linear-gradient(135deg,white_50%,#0a0a0a_50%)] border rounded-md shadow-sm overflow-hidden relative">
                        <div className="absolute inset-0 grid grid-cols-2">
                          <div className="p-1.5 flex flex-col gap-1">
                            <div className="h-2 bg-gray-200 rounded w-3/4" />
                            <div className="h-2 bg-gray-200 rounded w-1/2" />
                          </div>
                          <div className="p-1.5 flex flex-col gap-1">
                            <div className="h-2 bg-neutral-800 rounded w-3/4" />
                            <div className="h-2 bg-neutral-800 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-4 bg-primary rounded w-full mt-auto flex items-center justify-center text-[8px] text-primary-foreground z-10 absolute bottom-0 left-0 right-0 mx-1.5 mb-1.5">
                          Button
                        </div>
                      </div>
                      <span className="font-medium">System</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "network-access" && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Network Access</h2>
                <p className="text-sm text-muted-foreground">
                  Manage which IP addresses are allowed to access this dashboard and API.
                </p>
              </div>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Allowed IPs</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2 mb-4">
                    {ipsData?.allowed_ips.map((ip) => (
                      <div
                        key={ip}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <code className="text-xs font-mono">{ip}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            ["127.0.0.1", "::1", "localhost"].includes(ip)
                              ? "text-muted-foreground/30 cursor-not-allowed"
                              : "text-muted-foreground hover:text-destructive",
                          )}
                          onClick={() => deleteIp.mutate(ip)}
                          disabled={
                            ["127.0.0.1", "::1", "localhost"].includes(ip) || deleteIp.isPending
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter IP address (e.g. 192.168.1.100)"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddIp();
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddIp}
                      disabled={!newIp.trim() || addIp.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
