import type { ProjectType } from "./types";

export interface Rubric {
  /** Short labels for the UI, index = grade. */
  labels: readonly [string, string, string, string];
  /** Full level descriptions sent to Jev, index = grade. */
  levels: readonly [string, string, string, string];
  activities: Record<string, string>;
}

export const SRC: Record<ProjectType, Rubric> = {
  plantation: {
    labels: ["Degraded", "No change", "Partially established", "Established"],
    levels: [
      "Degraded: fewer or dead plants than at baseline, or the ground is damaged or cleared",
      "No change: the site looks essentially as it did at baseline",
      "Partially established: new planting is visible but sparse, very young, or uneven across the site",
      "Established: dense, healthy planting is clearly visible across most of the site",
    ],
    activities: {
      digging: "Pits or trenches being dug, soil preparation",
      planting: "Saplings being placed in the ground",
      watering: "Watering or irrigation",
      maintenance: "Weeding, fencing, tree guards, mulching",
      other: "None of the above",
    },
  },
  cleanup: {
    labels: ["Worse", "No change", "Partially cleared", "Cleared"],
    levels: [
      "Worse: more waste or dumping than at baseline",
      "No change: waste levels look the same as at baseline",
      "Partially cleared: a visible reduction in waste, but waste remains",
      "Cleared: the site is essentially free of waste",
    ],
    activities: {
      collection: "People collecting or bagging waste",
      transport: "Waste being loaded or carried away",
      sorting: "Waste being sorted or weighed",
      other: "None of the above",
    },
  },
  water_point: {
    labels: ["Non-functional", "No change", "Being installed", "In use"],
    levels: [
      "Non-functional: the water point is broken, dry or damaged",
      "No change: no visible difference from baseline",
      "Being installed: construction or installation is under way but not complete",
      "In use: the water point is complete and visibly working or being used",
    ],
    activities: {
      drilling: "Drilling, digging or pipe laying",
      installation: "Fitting pumps, taps, tanks or platforms",
      use: "People drawing water",
      other: "None of the above",
    },
  },
  sanitation: {
    labels: ["Unusable", "No change", "Under construction", "Complete and usable"],
    levels: [
      "Unusable: the facility is broken, locked, flooded or damaged",
      "No change: no visible difference from baseline",
      "Under construction: work is visibly under way but not complete",
      "Complete and usable: the facility is complete, clean and usable",
    ],
    activities: {
      construction: "Building walls, roof, pits or plumbing",
      cleaning: "Cleaning or maintenance",
      use: "People using the facility",
      other: "None of the above",
    },
  },
  construction: {
    labels: ["Regressed", "No progress", "In progress", "Complete"],
    levels: [
      "Regressed: damage or removal compared to baseline",
      "No progress: no visible difference from baseline",
      "In progress: visible progress but incomplete",
      "Complete: the work appears finished",
    ],
    activities: {
      excavation: "Digging, levelling or demolition",
      building: "Laying, pouring, erecting or paving",
      finishing: "Painting, fitting, cleaning up",
      other: "None of the above",
    },
  },
};

export function gradeLabel(type: ProjectType, grade: number): string {
  return SRC[type].labels[grade as 0 | 1 | 2 | 3] ?? "Unknown";
}
