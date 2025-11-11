// src/stories/types.ts

export type ScrollTarget = 'problem' | 'canvas' | 'metrics' | 'configuration' | 'basin-of-convergence' | 'top';

export interface StoryStep {
  experimentId: string;  // References existing experiment preset
  narrative: string;     // Brief 1-2 sentence explanation for banner
  scrollTo?: ScrollTarget; // Optional: where to scroll when this step loads
}

export interface Story {
  id: string;                    // 'step-size-evolution'
  title: string;                 // 'Step Size Evolution'
  description: string;           // For stories page listing
  steps: StoryStep[];
}
