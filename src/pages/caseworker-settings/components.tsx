import type React from "react";
import { AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SOURCE_TYPE_OPTIONS = [
  { value: "document", label: "Document" },
  { value: "annual_report", label: "Annual Report" },
  { value: "case_evidence", label: "Case Evidence" },
  { value: "court_decision", label: "Court Decision" },
  { value: "law_journal", label: "Law Journal" },
  { value: "faq", label: "FAQ" },
  { value: "methodology", label: "Methodology" },
  { value: "webpage", label: "Webpage" },
  { value: "json", label: "JSON" },
] as const;

const SOURCE_TYPE_VALUES = new Set(SOURCE_TYPE_OPTIONS.map((option) => option.value));

export function SourceTypeControl({
  value,
  onChange,
  idPrefix,
}: {
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
}) {
  const selectedValue = SOURCE_TYPE_VALUES.has(value as (typeof SOURCE_TYPE_OPTIONS)[number]["value"]) ? value : "custom";
  const customValue = selectedValue === "custom" ? value : "";

  return (
    <div className="space-y-1">
      <Label htmlFor={`${idPrefix}-select`}>Source Type</Label>
      <Select
        value={selectedValue}
        onValueChange={(nextValue) => {
          if (nextValue === "custom") {
            onChange(SOURCE_TYPE_VALUES.has(value as (typeof SOURCE_TYPE_OPTIONS)[number]["value"]) ? "" : value);
            return;
          }
          onChange(nextValue);
        }}
      >
        <SelectTrigger id={`${idPrefix}-select`}>
          <SelectValue placeholder="Choose source type" />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom...</SelectItem>
        </SelectContent>
      </Select>
      {selectedValue === "custom" ? (
        <Input
          id={`${idPrefix}-custom`}
          value={customValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder="custom_source_type"
        />
      ) : null}
      <p className="text-xs text-muted-foreground">Used as metadata for search filtering; the importer will not guess it.</p>
    </div>
  );
}
export function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "blue" | "red" | "amber";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function AlertBanner({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onCheckedChange,
  description,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
