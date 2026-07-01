import { describe, it, expect, vi, beforeEach } from "vitest";

// The OIDC token fetch touches the browser UserManager; stub it so the request
// interceptor is inert in tests.
vi.mock("./oidc", () => ({ getAccessToken: vi.fn().mockResolvedValue(null) }));

// Capture what the axios instance is asked to fetch. `axios.create` returns our
// spy client; each verb records its (url, body) and resolves an empty body so
// the wrappers just relay the shape. `vi.hoisted` lets the mock factory (which
// is hoisted above imports) share the `calls` array with the test bodies.
const { calls } = vi.hoisted(() => ({
  calls: [] as { method: string; url: string; body?: unknown }[],
}));

vi.mock("axios", () => {
  const record =
    (method: string) =>
    (url: string, body?: unknown) => {
      calls.push({ method, url, body });
      return Promise.resolve({ data: {} });
    };
  const instance = {
    get: record("get"),
    post: record("post"),
    put: record("put"),
    patch: record("patch"),
    delete: record("delete"),
    interceptors: { request: { use: () => undefined } },
  };
  return { default: { create: () => instance } };
});

import {
  listNesEntities,
  getNesEntity,
  deleteNesEntity,
  reindexNes,
  searchEntities,
  listCourtCases,
  listCourts,
  deleteCourtCase,
  getCourt,
  createCourt,
  updateCourt,
  getFirm,
  createFirm,
  updateFirm,
  uploadMaterialFile,
  listMaterials,
  deleteMaterial,
  listCases,
  patchCase,
  deleteCase,
  createSource,
  buildSourceFormData,
} from "./admin-api";

beforeEach(() => {
  calls.length = 0;
});

// TASK A — the client must address the SINGLE unified /api root; the former
// /api/nes and /api/ngm prefixes were hard-cut.
describe("admin-api unified paths (no /api/nes or /api/ngm)", () => {
  it("routes NES entities to /api/entities and reindex to /api/admin/reindex", async () => {
    await listNesEntities();
    await getNesEntity("person/ram-bahadur");
    await deleteNesEntity("person/ram-bahadur");
    await reindexNes();
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "get /api/entities",
      "get /api/entities/person/ram-bahadur",
      "delete /api/entities/person/ram-bahadur",
      "post /api/admin/reindex",
    ]);
  });

  it("routes court cases to /api/courtcases and courts to /api/courts", async () => {
    await listCourtCases();
    await listCourts();
    await deleteCourtCase("special", "081-CR-0060");
    expect(calls.map((c) => c.url)).toEqual([
      "/api/courtcases/",
      "/api/courts/",
      "/api/courtcases/special/081-CR-0060",
    ]);
  });

  it("routes materials to /api/materials", async () => {
    await listMaterials();
    await deleteMaterial("ciaa", "press-2081-042");
    expect(calls.map((c) => c.url)).toEqual([
      "/api/materials/",
      "/api/materials/ciaa/press-2081-042",
    ]);
  });

  it("keeps Jawafdehi cases on /api/cases and PATCHes with RFC-6902 ops", async () => {
    await listCases();
    await patchCase("oxygen-plant", [{ op: "replace", path: "/title", value: "X" }]);
    await deleteCase("oxygen-plant");
    expect(calls[0].url).toBe("/api/cases/");
    expect(calls[1]).toMatchObject({
      method: "patch",
      url: "/api/cases/oxygen-plant/",
      body: [{ op: "replace", path: "/title", value: "X" }],
    });
    expect(calls[2]).toMatchObject({
      method: "delete",
      url: "/api/cases/oxygen-plant/",
    });
  });

  it("posts a source create as multipart FormData to /api/sources/", async () => {
    await createSource({ title: "Report" });
    expect(calls[0].method).toBe("post");
    expect(calls[0].url).toBe("/api/sources/");
    expect(calls[0].body).toBeInstanceOf(FormData);
  });

  it("routes the entity picker (searchEntities) to /api/entities (not /api/nes)", async () => {
    await searchEntities("ram", 10);
    expect(calls[0]).toMatchObject({ method: "get", url: "/api/entities" });
  });

  it("routes courts to /api/courts (create=POST list, update=PUT detail)", async () => {
    await getCourt("special");
    await createCourt({ identifier: "special" });
    await updateCourt("special", { identifier: "special" });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "get /api/courts/special/",
      "post /api/courts/",
      "put /api/courts/special/",
    ]);
  });

  it("routes firms to /api/firms keyed by numeric id (update=PATCH)", async () => {
    await getFirm(7);
    await createFirm({ firm_name: "ACME Builders" });
    await updateFirm(7, { firm_name: "ACME Builders" });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "get /api/firms/7/",
      "post /api/firms/",
      "patch /api/firms/7/",
    ]);
  });

  it("uploads a material file to /api/materials/{source}/{ident}/file", async () => {
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    await uploadMaterialFile("ciaa", "press-2081-042", file, "RAW", "official_report");
    expect(calls[0].method).toBe("post");
    expect(calls[0].url).toBe("/api/materials/ciaa/press-2081-042/file");
    expect(calls[0].body).toBeInstanceOf(FormData);
    const fd = calls[0].body as FormData;
    expect(fd.get("role")).toBe("RAW");
    expect(fd.get("material_type")).toBe("official_report");
    expect(fd.get("file")).toBeInstanceOf(File);
  });
});

// TASK B — the source multipart body is the load-bearing write contract.
describe("buildSourceFormData", () => {
  it("puts scalar fields as form fields and JSON-encodes urls", () => {
    const fd = buildSourceFormData({
      title: "Charge sheet",
      source_type: "LEGAL_PROCEDURAL",
      urls: [{ link: "https://x/1", role: "PERMALINK" }],
    });
    expect(fd.get("title")).toBe("Charge sheet");
    expect(fd.get("source_type")).toBe("LEGAL_PROCEDURAL");
    expect(fd.get("urls")).toBe(
      JSON.stringify([{ link: "https://x/1", role: "PERMALINK" }]),
    );
    // No file provided -> no file field.
    expect(fd.get("file")).toBeNull();
  });

  it("omits empty/nullish fields and attaches a file when given", () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    const fd = buildSourceFormData(
      { title: "Doc", description: "", source_type: null },
      file,
    );
    expect(fd.get("title")).toBe("Doc");
    expect(fd.get("description")).toBeNull();
    expect(fd.get("source_type")).toBeNull();
    expect(fd.get("file")).toBeInstanceOf(File);
  });
});
