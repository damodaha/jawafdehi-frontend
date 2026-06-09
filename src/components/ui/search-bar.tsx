import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = React.ComponentProps<typeof Input> & {
  buttonClassName?: string;
  inputClassName?: string;
  submitLabel?: string;
  submitText?: string;
};

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      buttonClassName,
      className,
      inputClassName,
      submitLabel = "Search",
      submitText,
      ...props
    },
    ref,
  ) => {
    const hasSubmitText = Boolean(submitText);

    return (
      <div className={cn("relative w-full", className)}>
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={ref}
          className={cn(
            "h-12 rounded-full pl-12",
            hasSubmitText ? "pr-40 sm:pr-48" : "pr-14",
            inputClassName,
          )}
          {...props}
        />
        <Button
          aria-label={submitLabel}
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full",
            hasSubmitText ? "h-9 px-4 sm:min-w-[10rem]" : "h-9 w-9 p-0",
            buttonClassName,
          )}
          type="submit"
        >
          {submitText || <Search aria-hidden="true" className="h-4 w-4" />}
        </Button>
      </div>
    );
  },
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
