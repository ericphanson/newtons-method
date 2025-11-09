// src/stories/index.ts
import { Story } from './types';

export const allStories: Story[] = [
  // Stories will be added here
];

export function getStory(id: string): Story | undefined {
  return allStories.find(s => s.id === id);
}

export * from './types';
