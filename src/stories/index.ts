// src/stories/index.ts
import { Story } from './types';
import { stepSizeEvolution } from './step-size-evolution';
import { newtonConvexity } from './newton-convexity';
import { lbfgsMemory } from './lbfgs-memory';

export const allStories: Story[] = [
  stepSizeEvolution,
  newtonConvexity,
  lbfgsMemory,
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}

export * from './types';
