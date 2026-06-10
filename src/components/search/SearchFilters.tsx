import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ArchiveSearchFacets,
  ArchiveSearchType,
  SearchFacetItem,
} from "@/types/search";

export type SidebarFilterName = "entity_type" | "role" | "case_type";

type SearchFiltersProps = {
  facets: ArchiveSearchFacets;
  selected: Record<SidebarFilterName, string[]>;
  selectedType?: ArchiveSearchType;
  onTypeChange: (type?: ArchiveSearchType) => void;
  onToggle: (name: SidebarFilterName, value: string) => void;
  onClear: () => void;
};

export function SearchFilters({
  facets,
  selected,
  selectedType,
  onTypeChange,
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

      <RecordTypeFilter
        items={facets.type}
        onChange={onTypeChange}
        selectedType={selectedType}
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
    </aside>
  );
}

export function SearchFiltersSkeleton() {
  const groups = [
    { control: "radio", rowCount: 4 },
    { control: "checkbox", rowCount: 4 },
    { control: "checkbox", rowCount: 3 },
    { control: "checkbox", rowCount: 3 },
  ] as const;

  return (
    <aside
      aria-hidden="true"
      className="space-y-4 rounded-xl border bg-card p-4"
    >
      <div className="flex h-8 items-center justify-between gap-4">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-8 w-12 rounded-md" />
      </div>

      {groups.map(({ control, rowCount }, groupIndex) => (
        <div className="space-y-2" key={groupIndex}>
          <Skeleton className="h-4 w-24" />
          <div className="space-y-1">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <div
                className="flex min-h-8 items-center gap-2 px-1"
                key={rowIndex}
              >
                <Skeleton
                  className={
                    control === "radio"
                      ? "h-4 w-4 shrink-0 rounded-full"
                      : "h-4 w-4 shrink-0 rounded-sm"
                  }
                />
                <Skeleton
                  className={
                    rowIndex % 2 === 0 ? "h-3.5 w-28" : "h-3.5 w-20"
                  }
                />
                <Skeleton className="ml-auto h-3 w-5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

function RecordTypeFilter({
  items,
  onChange,
  selectedType,
}: Readonly<{
  items: SearchFacetItem[];
  onChange: (type?: ArchiveSearchType) => void;
  selectedType?: ArchiveSearchType;
}>) {
  const displayItems = items.filter(
    (item) => ["case", "entity", "document"].includes(item.name),
  );

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-foreground">
        Record type
      </legend>
      <RadioGroup
        className="gap-0.5"
        onValueChange={(value) =>
          onChange(value === "all" ? undefined : value as ArchiveSearchType)
        }
        value={selectedType || "all"}
      >
        <FilterOption count={null} label="All records" value="all" />
        {displayItems.map((item) => (
          <FilterOption
            count={item.count}
            key={item.name}
            label={item.display_name}
            value={item.name}
          />
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function FilterOption({
  count,
  label,
  value,
}: Readonly<{
  count: number | null;
  label: string;
  value: string;
}>) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <RadioGroupItem
        aria-label={count === null ? label : `${label}: ${count} results`}
        value={value}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== null ? (
        <span className="text-xs tabular-nums">{count}</span>
      ) : null}
    </label>
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
  name: SidebarFilterName;
  onToggle: (name: SidebarFilterName, value: string) => void;
  selectedValues: string[];
  title: string;
}>) {
  const displayItems = [...(items || [])];
  selectedValues.forEach((val) => {
    if (!displayItems.some((item) => item.name === val)) {
      displayItems.push({
        name: val,
        display_name: val.replaceAll("_", " ").replaceAll("-", " "),
        count: 0,
      });
    }
  });

  if (displayItems.length === 0) return null;

  return (
    <fieldset className="space-y-0.5">
      <legend className="mb-1.5 text-sm font-semibold text-foreground">
        {title}
      </legend>
      {displayItems.map((item) => {
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
