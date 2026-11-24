import { describe, expect, it } from "vitest";
import { createEmptyResume, createSampleResume } from "@/lib/default-resume";
import {
  filterAndSortDashboardDocs,
  formatDashboardDate,
  getCvCompletionStatus,
} from "@/lib/dashboard-utils";

describe("Dashboard Utilities", () => {
  it("classifies untouched sample or incomplete CVs as draft and complete user CVs as ready", () => {
    const sample = createSampleResume("2026-01-01T00:00:00.000Z");
    // Sample contains default placeholder fullName/email -> ATS fix rule -> draft
    expect(getCvCompletionStatus(sample)).toBe("draft");

    const empty = createEmptyResume("cv-empty", "Draf Kosong");
    expect(getCvCompletionStatus(empty)).toBe("draft");

    const readyCv = {
      ...sample,
      id: "cv-ready",
      title: "CV Backend Engineer",
      basics: {
        ...sample.basics,
        fullName: "Arya Goberto",
        email: "arya@domain.id",
        phone: "+62 811-2233-4455",
      },
    };
    expect(getCvCompletionStatus(readyCv)).toBe("ready");
  });

  it("filters documents by completion status and case-insensitive search query", () => {
    const baseSample = createSampleResume("2026-01-01T00:00:00.000Z");
    const readyFrontend = {
      ...baseSample,
      id: "cv-1",
      title: "CV Frontend Tokopedia",
      targetRole: "Senior Frontend Engineer",
      updatedAt: "2026-03-10T08:00:00.000Z",
      basics: {
        ...baseSample.basics,
        fullName: "Nadia Putri",
        email: "nadia@example.com",
        phone: "+62 812-0000-1111",
      },
    };
    const draftBackend = {
      ...createEmptyResume("cv-2", "Draf Backend GoTo"),
      targetRole: "Backend Developer",
      updatedAt: "2026-03-15T10:00:00.000Z",
    };

    const docs = [readyFrontend, draftBackend];

    expect(
      filterAndSortDashboardDocs(docs, {
        query: "",
        statusFilter: "ready",
        sortBy: "updatedAt",
      }).map((d) => d.id)
    ).toEqual(["cv-1"]);

    expect(
      filterAndSortDashboardDocs(docs, {
        query: "",
        statusFilter: "draft",
        sortBy: "updatedAt",
      }).map((d) => d.id)
    ).toEqual(["cv-2"]);

    expect(
      filterAndSortDashboardDocs(docs, {
        query: "tokopedia",
        statusFilter: "all",
        sortBy: "updatedAt",
      }).map((d) => d.id)
    ).toEqual(["cv-1"]);

    expect(
      filterAndSortDashboardDocs(docs, {
        query: "backend developer",
        statusFilter: "all",
        sortBy: "updatedAt",
      }).map((d) => d.id)
    ).toEqual(["cv-2"]);
  });

  it("sorts documents by updatedAt descending or title ascending", () => {
    const docZ = {
      ...createEmptyResume("cv-z", "Zebra CV"),
      updatedAt: "2026-05-01T12:00:00.000Z",
    };
    const docA = {
      ...createEmptyResume("cv-a", "Alpha CV"),
      updatedAt: "2026-02-01T12:00:00.000Z",
    };

    expect(
      filterAndSortDashboardDocs([docA, docZ], {
        query: "",
        statusFilter: "all",
        sortBy: "updatedAt",
      }).map((d) => d.id)
    ).toEqual(["cv-z", "cv-a"]);

    expect(
      filterAndSortDashboardDocs([docZ, docA], {
        query: "",
        statusFilter: "all",
        sortBy: "title",
      }).map((d) => d.id)
    ).toEqual(["cv-a", "cv-z"]);
  });

  it("formats valid ISO dates deterministically and handles invalid strings safely", () => {
    expect(formatDashboardDate("2026-04-12T04:30:00.000Z")).toContain("2026");
    expect(formatDashboardDate("not-a-date")).toBe("Baru saja");
  });
});
