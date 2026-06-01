import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = React.ComponentProps<typeof Input> & {
  submitLabel?: string;
};

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, submitLabel = "Search", ...props }, ref) => (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden="true"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={ref}
        className="h-12 rounded-full pl-12 pr-14"
        {...props}
      />
      <Button
        aria-label={submitLabel}
        className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-0"
        type="submit"
      >
        <Search aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  ),
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
