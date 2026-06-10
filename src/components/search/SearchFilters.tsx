import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ArchiveSearchFacets, SearchFacetItem } from "@/types/search";

type FilterName = "type" | "entity_type" | "role" | "case_type" | "tags";

type SearchFiltersProps = {
  facets: ArchiveSearchFacets;
  selected: Record<FilterName, string[]>;
  onToggle: (name: FilterName, value: string) => void;
  onClear: () => void;
};

export function SearchFilters({
  facets,
  selected,
  onToggle,
  onClear,
}: Readonly<SearchFiltersProps>) {
  return (
    <aside
      aria-label="Archive search filters"
      className="space-y-4 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Filters
        </h2>
        <Button className="h-8 px-2 text-xs" onClick={onClear} variant="ghost">
          Clear
        </Button>
      </div>

      <FilterGroup
        items={facets.type}
        name="type"
        onToggle={onToggle}
        selectedValues={selected.type}
        title="Record type"
      />
      <FilterGroup
        items={facets.entity_type}
        name="entity_type"
        onToggle={onToggle}
        selectedValues={selected.entity_type}
        title="Entity type"
      />
      <FilterGroup
        items={facets.role}
        name="role"
        onToggle={onToggle}
        selectedValues={selected.role}
        title="Entity role"
      />
      <FilterGroup
        items={facets.case_type}
        name="case_type"
        onToggle={onToggle}
        selectedValues={selected.case_type}
        title="Case type"
      />
      <FilterGroup
        items={facets.tags}
        name="tags"
        onToggle={onToggle}
        selectedValues={selected.tags}
        title="Tags"
      />
    </aside>
  );
}

function FilterGroup({
  items,
  name,
  onToggle,
  selectedValues,
  title,
}: Readonly<{
  items: SearchFacetItem[];
  name: FilterName;
  onToggle: (name: FilterName, value: string) => void;
  selectedValues: string[];
  title: string;
}>) {
  return (
    <fieldset className="space-y-0.5">
      <legend className="mb-1.5 text-sm font-semibold text-foreground">
        {title}
      </legend>
      {items.map((item) => {
        const isChecked = selectedValues.includes(item.name);
        return (
          <label
            className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            key={item.name}
          >
            <Checkbox
              aria-label={`${item.display_name}: ${item.count} results`}
              checked={isChecked}
              onCheckedChange={() => onToggle(name, item.name)}
            />
            <span className="min-w-0 flex-1 truncate">{item.display_name}</span>
            <span className="text-xs tabular-nums">{item.count}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
