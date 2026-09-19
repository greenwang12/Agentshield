import { useEffect, useState } from "react";
import { Bell, Cable, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { StatusPill } from "@/components/agentshield/status";
import { getSystemStatus } from "@/services/metrics";
import { apiConfig } from "@/services/api";
import type { SystemStatus } from "@/types/agentshield";

const STORAGE_KEY = "agentshield.settings";

type LocalSettings = {
  backendUrl: string;
  refreshInterval: number;
  darkTheme: boolean;
  notifications: boolean;
};

function statusTone(state: "connected" | "degraded" | "offline") {
  if (state === "connected") return "success" as const;
  if (state === "degraded") return "warning" as const;
  return "danger" as const;
}

export function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<LocalSettings>({
    backendUrl: apiConfig.backendUrl,
    refreshInterval: 15,
    darkTheme: false,
    notifications: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getSystemStatus());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connection status could not be read.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings((prev) => ({ ...prev, ...(JSON.parse(stored) as Partial<LocalSettings>) }));
      } catch {
        /* ignore malformed local settings */
      }
    }
    void load();
  }, []);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  if (loading) return <LoadingState message="Reading runtime connection status..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Configuration"
        title="Settings"
        description="Point AgentShield at your runtime, tune refresh behaviour, and review live connection health."
      >
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Re-check connections
        </Button>
      </PageIntro>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Runtime connection"
          description="The service layer reads this backend URL for every request."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backendUrl">Backend URL</Label>
              <Input
                id="backendUrl"
                value={settings.backendUrl}
                onChange={(event) => setSettings({ ...settings, backendUrl: event.target.value })}
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-muted-foreground">
                Set <code className="text-foreground">VITE_AGENTSHIELD_API_URL</code> and
                <code className="text-foreground"> VITE_AGENTSHIELD_USE_MOCKS=false</code> to use
                the real backend.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-4 py-3">
              <span className="text-sm text-muted-foreground">Environment</span>
              <StatusPill label={status?.environment ?? "LOCAL"} tone="info" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-4 py-3">
              <span className="text-sm text-muted-foreground">Data source</span>
              <StatusPill
                label={apiConfig.useMocks ? "Mock data" : "Live backend"}
                tone={apiConfig.useMocks ? "warning" : "success"}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Connection status"
          description="Live health of each dependency in the guardrail pipeline."
        >
          <ul className="space-y-3">
            {[
              { label: "Backend", state: status?.backend ?? "offline" },
              { label: "Moss", state: status?.moss ?? "offline" },
              { label: "Gemini", state: status?.gemini ?? "offline" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Cable className="h-4 w-4 text-info" aria-hidden="true" />
                  {item.label}
                </span>
                <StatusPill
                  label={
                    item.state === "connected"
                      ? "Connected"
                      : item.state === "degraded"
                        ? "Degraded"
                        : "Offline"
                  }
                  tone={statusTone(item.state)}
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Current guardrail latency: {status?.currentLatencyMs ?? 0} ms (local measurement).
          </p>
        </SectionCard>

        <SectionCard title="Preferences" description="Local to this browser.">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh interval (seconds)</Label>
              <Input
                id="refresh"
                type="number"
                min={5}
                max={300}
                value={settings.refreshInterval}
                onChange={(event) =>
                  setSettings({ ...settings, refreshInterval: Number(event.target.value) || 15 })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="theme" className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-info" aria-hidden="true" />
                Dark interface
              </Label>
              <Switch
                id="theme"
                checked={settings.darkTheme}
                onCheckedChange={(checked) => setSettings({ ...settings, darkTheme: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-info" aria-hidden="true" />
                Notify on BLOCK decisions
              </Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save}>Save preferences</Button>
              {saved ? (
                <span className="text-sm text-success" role="status">
                  Preferences saved
                </span>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
