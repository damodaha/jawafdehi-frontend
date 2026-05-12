import { useEffect, useState } from "react";
import { Check, Plus, RefreshCw, Server, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMCPServer, listMCPServers, testMCPConnection } from "@/services/caseworker-api";
import type { MCPServer } from "@/types/caseworker";
import { AlertBanner, EmptyState, StatusPill } from "../components";

export function MCPTab() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<MCPServer> & { auth_token?: string }>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [status, setStatus] = useState<Record<number, boolean | null>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listMCPServers().then((data) => setServers(data.results ?? []));
  }, []);

  const cancel = () => {
    setCreating(false);
    setForm({});
    setError("");
  };

  const save = async () => {
    setError("");
    try {
      const created = await createMCPServer(form as Partial<MCPServer> & { auth_token: string });
      setServers((current) => [...current, created]);
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const test = async (id: number) => {
    setTesting(id);
    try {
      const result = await testMCPConnection(id);
      setStatus((current) => ({ ...current, [id]: result.connected }));
    } catch {
      setStatus((current) => ({ ...current, [id]: false }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">MCP Servers</p>
          <p className="text-sm text-muted-foreground">{servers.length} server{servers.length !== 1 ? "s" : ""} configured for tool access.</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => { setCreating(true); setForm({ name: "", display_name: "", url: "", auth_type: "bearer", auth_token: "" }); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Server</Button>
      </div>

      <Dialog open={creating} onOpenChange={(open) => !open && cancel()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>Register a tool server the caseworker assistant can connect to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="mcp-name">Name</Label>
                <Input id="mcp-name" value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="case-system" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mcp-display-name">Display Name</Label>
                <Input id="mcp-display-name" value={form.display_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="Case Management System" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="mcp-url">URL</Label>
                <Input id="mcp-url" value={form.url ?? ""} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://api.example.com/mcp" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mcp-auth-type">Auth Type</Label>
                <select
                  id="mcp-auth-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.auth_type ?? "bearer"}
                  onChange={(e) => setForm((p) => ({ ...p, auth_type: e.target.value as MCPServer["auth_type"] }))}
                >
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="mcp-auth-token">Auth Token</Label>
                <Input id="mcp-auth-token" type="password" value={form.auth_token ?? ""} onChange={(e) => setForm((p) => ({ ...p, auth_token: e.target.value }))} />
              </div>
            </div>
            {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancel}><X className="mr-1 h-4 w-4" /> Cancel</Button>
            <Button variant="primary" onClick={save}><Check className="mr-1 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {servers.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No MCP servers configured"
          description="Add a server to make external casework tools available to the assistant."
          action={<Button size="sm" variant="primary" onClick={() => { setCreating(true); setForm({ name: "", display_name: "", url: "", auth_type: "bearer", auth_token: "" }); setError(""); }}><Plus className="mr-1 h-4 w-4" /> Add Server</Button>}
        />
      ) : (
        <div className="space-y-2">
          {servers.map((server) => (
            <div key={server.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{server.display_name ?? server.name}</p>
                  {status[server.id] === true ? <StatusPill tone="green"><Zap className="mr-1 h-3 w-3" /> Connected</StatusPill> : null}
                  {status[server.id] === false ? <StatusPill tone="red">Failed</StatusPill> : null}
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">{server.url}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => test(server.id)} disabled={testing === server.id}>
                {status[server.id] === true ? <Zap className="mr-1 h-3 w-3" /> : <RefreshCw className={`mr-1 h-3 w-3 ${testing === server.id ? "animate-spin" : ""}`} />}
                Test
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
