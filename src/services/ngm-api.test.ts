import { describe, it, expect } from "vitest";
import { materialTail, parseCourtCaseRef } from "./ngm-api";

describe("materialTail", () => {
  it("strips a full material IRI to its <source>/<ident> tail", () => {
    expect(materialTail("https://jawafdehi.org/material/ciaa/press-2081-042")).toBe(
      "ciaa/press-2081-042",
    );
  });

  it("preserves a multi-segment source (court-derived material)", () => {
    expect(materialTail("https://jawafdehi.org/material/court/supreme.081-cr-0081")).toBe(
      "court/supreme.081-cr-0081",
    );
  });

  it("returns a bare tail unchanged", () => {
    expect(materialTail("dfmis/2")).toBe("dfmis/2");
  });
});

describe("parseCourtCaseRef", () => {
  it("splits a <court>:<number> ref into its composite key", () => {
    expect(parseCourtCaseRef("special:081-CR-0060")).toEqual({
      court: "special",
      caseNumber: "081-CR-0060",
    });
  });

  it("treats a bare number (no court prefix) as an empty court", () => {
    expect(parseCourtCaseRef("081-CR-0060")).toEqual({
      court: "",
      caseNumber: "081-CR-0060",
    });
  });

  it("only splits on the first colon (case numbers are colon-free)", () => {
    expect(parseCourtCaseRef("supreme:081-CR-0081")).toEqual({
      court: "supreme",
      caseNumber: "081-CR-0081",
    });
  });
});
