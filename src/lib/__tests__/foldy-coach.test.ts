import { describe, expect, it } from "vitest";
import { runAtsLint } from "@/lib/ats-linter";
import { createEmptyResume, createSampleResume } from "@/lib/default-resume";
import {
  buildDashboardGreeting,
  computeAtsReadinessScore,
  deriveFoldyMood,
  FOLDY_CELEBRATION_COOLDOWN_MS,
  FOLDY_TYPING_LOCK_MS,
  getNextBestCoachTip,
  resolveMaturityStage,
  shouldTriggerMilestone,
  type FoldyPrefs,
} from "@/lib/foldy-coach";
import { DEFAULT_FOLDY_PREFS, parseFoldyPrefs } from "@/lib/foldy-prefs";
import type { ResumeDocument } from "@/lib/schemas/resume";

function createReadyResume(id = "doc-ready"): ResumeDocument {
  const doc = createSampleResume("2026-01-01T00:00:00.000Z");
  return {
    ...doc,
    id,
    title: "CV Siap Kirim",
    basics: {
      ...doc.basics,
      fullName: "Nadia Kusuma",
      email: "nadia.kusuma@example.com",
      phone: "+62 812 3456 7890",
    },
    sections: {
      ...doc.sections,
      experience: {
        ...doc.sections.experience,
        items: doc.sections.experience.items.map((item) => ({
          ...item,
          startDate: "Jan 2022",
          endDate: "Present",
        })),
      },
      education: {
        ...doc.sections.education,
        items: doc.sections.education.items.map((item) => ({
          ...item,
          startDate: "Aug 2018",
          endDate: "Jul 2022",
        })),
      },
    },
  };
}

describe("foldy-coach", () => {
  it("caps readiness score on sample starter and empty resumes", () => {
    const sample = createSampleResume("2026-01-01T00:00:00.000Z");
    const sampleReport = runAtsLint(sample);
    expect(computeAtsReadinessScore(sampleReport, sample)).toBeLessThanOrEqual(45);

    const empty = createEmptyResume("empty-1", "Kosong");
    const emptyReport = runAtsLint(empty);
    expect(computeAtsReadinessScore(emptyReport, empty)).toBeLessThanOrEqual(35);
  });

  it("computes high readiness score and happy mood for clean ready resume", () => {
    const ready = createReadyResume();
    const report = runAtsLint(ready);
    const score = computeAtsReadinessScore(report, ready);

    expect(score).toBeGreaterThanOrEqual(80);
    expect(deriveFoldyMood({ report, doc: ready })).toBe("happy");
  });

  it("prioritizes ai mood when AI or Cloud sync is running", () => {
    const ready = createReadyResume();
    const report = runAtsLint(ready);

    expect(deriveFoldyMood({ report, doc: ready, isAiBusy: true })).toBe("ai");
    expect(deriveFoldyMood({ report, doc: ready, isSyncing: true })).toBe("ai");
    expect(
      deriveFoldyMood({ report, doc: ready, isAiBusy: true, overrideMood: "wink" })
    ).toBe("wink");
  });

  it("returns 1 highest-priority coach tip (fix -> sample -> review -> all-clear)", () => {
    const empty = createEmptyResume("empty-1", "Kosong");
    const emptyTip = getNextBestCoachTip(runAtsLint(empty), empty);
    expect(emptyTip.id).toBe("contact-completeness");
    expect(emptyTip.targetSection).toBe("basics");
    expect(emptyTip.actionKind).toBe("jump-section");

    const sample = createSampleResume("2026-01-01T00:00:00.000Z");
    const sampleTip = getNextBestCoachTip(runAtsLint(sample), sample);
    expect(sampleTip.id).toBe("replace-sample-profile");
    expect(sampleTip.mood).toBe("wink");

    const ready = createReadyResume();
    const withReview: ResumeDocument = {
      ...ready,
      sections: {
        ...ready.sections,
        education: {
          ...ready.sections.education,
          items: ready.sections.education.items.map((item) => ({
            ...item,
            startDate: "2018",
            endDate: "2022",
          })),
        },
      },
    };
    const reviewTip = getNextBestCoachTip(runAtsLint(withReview), withReview);
    expect(reviewTip.id).toBe("inconsistent-dates");
    expect(reviewTip.mood).toBe("crafty");

    const readyTip = getNextBestCoachTip(runAtsLint(ready), ready);
    expect(readyTip.id).toBe("ats-all-clear");
    expect(readyTip.mood).toBe("happy");
  });

  it("resolves adaptive maturity stages accurately", () => {
    const empty = createEmptyResume("d1", "Draft");
    const ready1 = createReadyResume("d2");
    const ready2 = createReadyResume("d3");

    expect(resolveMaturityStage(DEFAULT_FOLDY_PREFS, [empty])).toBe("onboarding");
    expect(resolveMaturityStage(DEFAULT_FOLDY_PREFS, [ready1])).toBe("guided");
    expect(resolveMaturityStage(DEFAULT_FOLDY_PREFS, [ready1, ready2])).toBe(
      "quiet-pro"
    );

    const exportedPrefs: FoldyPrefs = {
      ...DEFAULT_FOLDY_PREFS,
      hasExportedPdf: true,
    };
    expect(resolveMaturityStage(exportedPrefs, [empty])).toBe("quiet-pro");
  });

  it("enforces hysteresis, typing lock, cooldown, and visibility guards on milestones", () => {
    const now = 100_000;

    // Passes when active, not achieved yet, user stopped typing, outside cooldown
    expect(
      shouldTriggerMilestone({
        milestoneId: "ats-80",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: 0,
        lastTypingAt: now - FOLDY_TYPING_LOCK_MS - 500,
        now,
        visibility: "full",
        maturity: "guided",
      })
    ).toBe(true);

    // Hysteresis blocks duplicate passive milestone for the same document
    expect(
      shouldTriggerMilestone({
        milestoneId: "ats-80",
        docId: "doc-1",
        achievedMilestones: { "doc-1": ["ats-80"] },
        lastCelebrationAt: 0,
        lastTypingAt: now - 5000,
        now,
        visibility: "full",
        maturity: "guided",
      })
    ).toBe(false);

    // Typing lock suppresses passive milestones while typing
    expect(
      shouldTriggerMilestone({
        milestoneId: "ats-80",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: 0,
        lastTypingAt: now - 300,
        now,
        visibility: "full",
        maturity: "guided",
      })
    ).toBe(false);

    // Cooldown suppresses rapid consecutive passive celebrations
    expect(
      shouldTriggerMilestone({
        milestoneId: "ats-clean",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: now - (FOLDY_CELEBRATION_COOLDOWN_MS - 1000),
        lastTypingAt: now - 5000,
        now,
        visibility: "full",
        maturity: "guided",
      })
    ).toBe(false);

    // Quiet mode / quiet-pro suppresses passive milestones, but allows explicit PDF export celebration
    expect(
      shouldTriggerMilestone({
        milestoneId: "ats-80",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: 0,
        lastTypingAt: now - 5000,
        now,
        visibility: "quiet",
        maturity: "guided",
      })
    ).toBe(false);

    expect(
      shouldTriggerMilestone({
        milestoneId: "pdf-export",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: now - 1000,
        lastTypingAt: now - 100,
        now,
        visibility: "quiet",
        maturity: "quiet-pro",
        explicitUserAction: true,
      })
    ).toBe(true);

    // Hidden blocks everything
    expect(
      shouldTriggerMilestone({
        milestoneId: "pdf-export",
        docId: "doc-1",
        achievedMilestones: {},
        lastCelebrationAt: 0,
        lastTypingAt: 0,
        now,
        visibility: "hidden",
        maturity: "onboarding",
        explicitUserAction: true,
      })
    ).toBe(false);
  });

  it("builds contextual dashboard greetings based on ready/draft counts", () => {
    const empty = createEmptyResume("d1", "Draft");
    const ready = createReadyResume("d2");

    expect(buildDashboardGreeting([], "onboarding").mood).toBe("sleepy");
    expect(buildDashboardGreeting([empty], "onboarding").mood).toBe("crafty");
    expect(buildDashboardGreeting([ready], "guided").mood).toBe("happy");
    expect(buildDashboardGreeting([ready, empty], "guided").mood).toBe("wink");
    expect(buildDashboardGreeting([ready], "guided", true).mood).toBe("ai");
  });

  it("safely parses stored preferences and falls back on malformed JSON", () => {
    expect(parseFoldyPrefs(null)).toEqual(DEFAULT_FOLDY_PREFS);
    expect(parseFoldyPrefs("{broken")).toEqual(DEFAULT_FOLDY_PREFS);
    expect(
      parseFoldyPrefs(
        JSON.stringify({
          visibility: "quiet",
          hasExportedPdf: true,
          achievedMilestones: { "doc-1": ["ats-80", 123] },
        })
      )
    ).toEqual({
      visibility: "quiet",
      hasExportedPdf: true,
      achievedMilestones: { "doc-1": ["ats-80"] },
    });
  });
});
