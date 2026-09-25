/** Starting values; Task 38 recalibrates them against the labelled holdout. */
export const THRESHOLDS = {
  choiceAccept: 0.8,
  srcAccept: 0.7,
  sentenceKeep: 0.75,
  searchKeep: 0.5,
  recycledHamming: 6,
  duplicateWindowHours: 24,
  candidateSiteMaxM: 5000,
  candidateSiteLimit: 50,
  triageBatchSize: 8,
} as const;

/** TypeSafe list price: input $0.042 per million tokens; output free. */
export const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;
