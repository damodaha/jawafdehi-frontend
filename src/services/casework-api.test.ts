import { describe, it, expect } from "vitest";
import { buildSubmitPayload } from "./casework-api";

describe("buildSubmitPayload", () => {
  it("routes a court case ref to court_case_number", () => {
    expect(buildSubmitPayload("special:081-CR-0079")).toEqual({
      court_case_number: "special:081-CR-0079",
    });
  });

  it("routes a bare slug to slug", () => {
    expect(buildSubmitPayload("case-081-cr-0136-oxygen-plant")).toEqual({
      slug: "case-081-cr-0136-oxygen-plant",
    });
  });

  it("routes a full case URL to slug (backend extracts the slug)", () => {
    expect(buildSubmitPayload("https://jawafdehi.org/case/alpha-case")).toEqual({
      slug: "https://jawafdehi.org/case/alpha-case",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(buildSubmitPayload("  special:081-CR-0079  ")).toEqual({
      court_case_number: "special:081-CR-0079",
    });
    expect(buildSubmitPayload("  alpha-case  ")).toEqual({ slug: "alpha-case" });
  });
});
