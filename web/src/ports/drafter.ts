export interface Fact { id: string; text: string; evidenceIds: string[] }

export interface DrafterPort {
  /** Returns plain text where every sentence ends with citations like [F1][F3]. */
  draft(input: { projectName: string; periodStart: string; periodEnd: string; facts: Fact[] }): Promise<string>;
}
