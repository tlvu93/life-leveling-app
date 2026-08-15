export type NodeId = string;
export type PathId = string;
export type GuideId = string;
export type StepId = string;
export type BuildId = string;
export type ArtifactId = string;
export type QuestId = string;

export type InterestId = 'music' | 'technology' | 'movement' | 'language' | 'making' | 'design';

export const interestLabels: Record<InterestId, string> = {
  music: 'Music',
  technology: 'Technology',
  movement: 'Movement',
  language: 'Language',
  making: 'Making',
  design: 'Design',
};
