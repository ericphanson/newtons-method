// src/stories/index.ts
import { Story } from './types';
import { stepSizeEvolution } from './step-size-evolution';

export const allStories: Story[] = [
  stepSizeEvolution,
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}

export * from './types';
