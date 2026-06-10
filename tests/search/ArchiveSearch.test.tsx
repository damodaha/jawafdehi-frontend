import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ArchiveSearch from "@/pages/ArchiveSearch";
import type { ArchiveSearchResponse } from "@/types/search";

const { searchArchiveMock } = vi.hoisted(() => ({
  searchArchiveMock: vi.fn(),
}));

vi.mock("@/services/search-api", () => ({
  searchArchive: searchArchiveMock,
}));

const baseResponse: ArchiveSearchResponse = {
  query: "",
  page: 1,
  page_size: 10,
  count: 12,
  counts: {
    all: 12,
    cases: 8,
    entities: 3,
    documents: 1,
  },
  facets: {
    type: [
      { name: "case", display_name: "Cases", count: 8 },
      { name: "entity", display_name: "Entities", count: 3 },
      { name: "document", display_name: "Documents", count: 1 },
    ],
    entity_type: [
      { name: "person", display_name: "People", count: 4 },
    ],
    role: [
      { name: "accused", display_name: "Accused", count: 5 },
    ],
    case_type: [
      { name: "corruption", display_name: "Corruption", count: 7 },
    ],
    tags: [
      { name: "CIAA", display_name: "CIAA", count: 6 },
    ],
  },
  results: [
    {
      result_type: "case",
      id: 1,
      title: "Original result",
      description: "Original description",
      url: "/case/1",
      api_url: "/api/case/1",
      matched_fields: [],
      score: 1,
      slug: "original-result",
      state: "filed",
      case_type: "corruption",
      date: null,
      tags: ["CIAA"],
      entities: [],
    },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function LocationState() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderSearch(initialEntry = "/search") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              element={
                <>
                  <ArchiveSearch />
                  <LocationState />
                </>
              }
              path="/search"
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe("ArchiveSearch", () => {
  beforeEach(() => {
    searchArchiveMock.mockReset();
  });

  it("shows filter, count, and result skeletons on the initial load", () => {
    searchArchiveMock.mockReturnValue(new Promise(() => undefined));

    renderSearch();

    expect(
      screen.getByRole("status", { name: "Searching archive" }),
    ).toBeTruthy();
    expect(document.querySelectorAll('aside[aria-hidden="true"]').length).toBe(
      2,
    );
    expect(
      document.querySelector('p[aria-live="polite"] [aria-hidden="true"]'),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("region", { name: "Archive search results" })
        .getAttribute("aria-busy"),
    ).toBe("true");
  });

  it("keeps filters stable but replaces results during a refresh", async () => {
    const refresh = deferred<ArchiveSearchResponse>();
    searchArchiveMock
      .mockResolvedValueOnce(baseResponse)
      .mockReturnValueOnce(refresh.promise);

    renderSearch();
    await screen.findByText("Original result");

    fireEvent.click(
      screen.getAllByRole("checkbox", {
        name: "Accused: 5 results",
      })[0],
    );

    await waitFor(() => {
      expect(
        screen
          .getAllByRole("checkbox", { name: "Accused: 5 results" })[0]
          .getAttribute("data-state"),
      ).toBe("checked");
    });
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("status", { name: "Searching archive" }),
    ).toBeTruthy();
    expect(
      document.querySelector('p[aria-live="polite"] [aria-hidden="true"]'),
    ).toBeTruthy();
    expect(screen.queryByText("Original result")).toBeNull();
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
    expect(
      screen
        .getByRole("region", { name: "Archive search results" })
        .getAttribute("aria-busy"),
    ).toBe("true");

    refresh.resolve({
      ...baseResponse,
      count: 1,
      results: [
        {
          ...baseResponse.results[0],
          id: 2,
          title: "Filtered result",
          url: "/case/2",
        },
      ],
    });

    expect(await screen.findByText("Filtered result")).toBeTruthy();
  });

  it("uses a single-select record type with an explicit all option", async () => {
    searchArchiveMock.mockResolvedValue(baseResponse);
    renderSearch();
    await screen.findByText("Original result");

    fireEvent.click(
      screen.getAllByRole("radio", { name: "Cases: 8 results" })[0],
    );

    await waitFor(() => {
      expect(screen.getByTestId("location-search").textContent).toContain(
        "type=case",
      );
    });
    expect(
      screen
        .getAllByRole("radio", { name: "Cases: 8 results" })[0]
        .getAttribute("data-state"),
    ).toBe("checked");

    fireEvent.click(screen.getAllByRole("radio", { name: "All records" })[0]);

    await waitFor(() => {
      expect(screen.getByTestId("location-search").textContent).not.toContain(
        "type=",
      );
    });
    expect(
      screen
        .getAllByRole("radio", { name: "All records" })[0]
        .getAttribute("data-state"),
    ).toBe("checked");
  });

  it("adds card tags as URL refinements without exposing a tag sidebar", async () => {
    searchArchiveMock.mockResolvedValue(baseResponse);
    renderSearch();
    await screen.findByText("Original result");

    fireEvent.click(screen.getByRole("button", { name: "CIAA" }));

    await waitFor(() => {
      expect(screen.getByTestId("location-search").textContent).toContain(
        "tags=CIAA",
      );
    });
    expect(screen.queryByRole("group", { name: "Tags" })).toBeNull();
  });

  it("does not show an empty state after an initial request failure", async () => {
    searchArchiveMock.mockRejectedValue(new Error("Unavailable"));
    renderSearch();

    expect(
      await screen.findByText("Archive search could not be loaded."),
    ).toBeTruthy();
    expect(screen.queryByText("No archive records found")).toBeNull();
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("keeps filters but hides stale results after a refresh failure", async () => {
    searchArchiveMock
      .mockResolvedValueOnce(baseResponse)
      .mockRejectedValueOnce(new Error("Unavailable"));
    renderSearch();
    await screen.findByText("Original result");

    fireEvent.click(
      screen.getAllByRole("checkbox", {
        name: "Accused: 5 results",
      })[0],
    );

    expect(
      await screen.findByText("Archive search could not be loaded."),
    ).toBeTruthy();
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
    expect(screen.queryByText("Original result")).toBeNull();
    expect(screen.queryByText("No archive records found")).toBeNull();
  });
});
