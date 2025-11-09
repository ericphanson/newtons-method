// src/stories/types.ts

export interface StoryStep {
  experimentId: string;  // References existing experiment preset
  narrative: string;     // Brief 1-2 sentence explanation for banner
}

export interface Story {
  id: string;                    // 'step-size-evolution'
  title: string;                 // 'Step Size Evolution'
  description: string;           // For stories page listing
  steps: StoryStep[];
}
