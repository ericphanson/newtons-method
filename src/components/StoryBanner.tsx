// src/components/StoryBanner.tsx
import React from 'react';
import { Story } from '../stories/types';

interface StoryBannerProps {
  story: Story;
  currentStepIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onShowTOC: () => void;
}

export const StoryBanner: React.FC<StoryBannerProps> = ({
  story,
  currentStepIndex,
  onPrevious,
  onNext,
  onExit,
  onShowTOC
}) => {
  // Bounds checking - protect against invalid step index
  if (!story.steps || story.steps.length === 0) {
    return null;
  }

  const safeIndex = Math.max(0, Math.min(currentStepIndex, story.steps.length - 1));
  const currentStep = story.steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === story.steps.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Exit button */}
        <button
          onClick={onExit}
          className="text-white hover:bg-blue-700 px-2 py-1 rounded transition-colors"
          aria-label="Exit story"
        >
          ✕
        </button>

        {/* Story progress (clickable for TOC) */}
        <div className="flex-none">
          <button onClick={onShowTOC} className="hover:underline">
            {story.title} - Step {currentStepIndex + 1}/{story.steps.length}
          </button>
        </div>

        {/* Narrative text */}
        <div className="flex-1 text-sm">
          {currentStep.narrative}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className="px-3 py-1 bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
