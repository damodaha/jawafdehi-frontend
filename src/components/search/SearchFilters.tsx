import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  ArchiveSearchResponse,
  ArchiveSearchType,
  SearchFacetItem,
} from "@/types/search";

type FilterName = "type" | "status" | "role" | "case_type";

type SearchFiltersProps = {
  facets: ArchiveSearchResponse["facets"];
  activeType: ArchiveSearchType;
  status?: string;
  role?: string;
  caseType?: string;
  onChange: (name: FilterName, value?: string) => void;
  onClear: () => void;
};

const supportedTypes = new Set([
  "case",
  "person",
  "organization",
  "location",
  "document",
]);

export function SearchFilters({
  facets,
  activeType,
  status,
  role,
  caseType,
  onChange,
  onClear,
}: SearchFiltersProps) {
  return (
    <aside
      aria-label="Archive search filters"
      className="space-y-6 rounded-xl border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          Filters
        </h2>
        <Button className="h-9 px-3 text-xs" onClick={onClear} variant="ghost">
          Clear
        </Button>
      </div>

      <FilterGroup
        activeValue={activeType === "all" || activeType === "entity" ? undefined : activeType}
        items={facets.type.filter((item) => supportedTypes.has(item.name))}
        name="type"
        onChange={onChange}
        title="Type"
      />
      <FilterGroup
        activeValue={status}
        items={facets.status}
        name="status"
        onChange={onChange}
        title="Case status"
      />
      <FilterGroup
        activeValue={role}
        items={facets.role}
        name="role"
        onChange={onChange}
        title="Entity role"
      />
      <FilterGroup
        activeValue={caseType}
        items={facets.case_type}
        name="case_type"
        onChange={onChange}
        title="Case type"
      />
    </aside>
  );
}

function FilterGroup({
  activeValue,
  items,
  name,
  onChange,
  title,
}: {
  activeValue?: string;
  items: SearchFacetItem[];
  name: FilterName;
  onChange: (name: FilterName, value?: string) => void;
  title: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-foreground">{title}</legend>
      {items.map((item) => {
        const isChecked = item.name === activeValue;
        return (
          <label
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            key={item.name}
          >
            <Checkbox
              aria-label={`${item.display_name}: ${item.count} results`}
              checked={isChecked}
              onCheckedChange={(checked) =>
                onChange(name, checked === true ? item.name : undefined)
              }
            />
            <span className="flex-1">{item.display_name}</span>
            <span className="text-xs tabular-nums">{item.count}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

