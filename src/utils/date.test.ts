import { describe, it, expect } from "vitest";
import { formatDateWithBS } from "@/utils/date";
import { formatBSString } from "@/utils/bs-calendar";

describe("formatBSString", () => {
  it("formats a curated BS date string in Devanagari", () => {
    // 2081-10-27 BS -> "२०८१ माघ २७"
    expect(formatBSString("2081-10-27")).toBe("२०८१ माघ २७");
  });

  it("returns null for malformed input", () => {
    expect(formatBSString("2081/10/27")).toBeNull();
    expect(formatBSString("")).toBeNull();
    expect(formatBSString(undefined)).toBeNull();
    expect(formatBSString("2081-13-01")).toBeNull();
  });
});

describe("formatDateWithBS with bsOverride", () => {
  it("uses the curated BS date verbatim when provided", () => {
    const out = formatDateWithBS("2025-02-09", "PP", "2081-10-27");
    expect(out).toContain("२०८१ माघ २७");
  });

  it("falls back to computed BS when override is absent", () => {
    const out = formatDateWithBS("2025-02-09", "PP");
    // Computed conversion of 2025-02-09 is also 2081 माघ 27.
    expect(out).toContain("२०८१");
  });

  it("falls back to computed BS when override is malformed", () => {
    const out = formatDateWithBS("2025-02-09", "PP", "garbage");
    expect(out).toContain("२०८१");
  });
});
