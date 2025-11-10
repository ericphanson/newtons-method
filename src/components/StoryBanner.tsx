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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl z-50 border-t-2 border-blue-400">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Exit button */}
          <button
            onClick={onExit}
            className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all text-lg font-semibold"
            aria-label="Exit story"
            title="Exit story"
          >
            ✕
          </button>

          {/* Story progress (clickable for TOC) */}
          <div className="flex-none">
            <button
              onClick={onShowTOC}
              className="text-left hover:bg-white/10 px-3 py-2 rounded-lg transition-all group"
              title="Click to view table of contents"
            >
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm text-blue-100 group-hover:text-white transition-colors">
                  {story.title}
                </div>
                <svg
                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-xs text-blue-200 mt-0.5">
                Story Step {safeIndex + 1} of {story.steps.length}
              </div>
            </button>
          </div>

          {/* Narrative text */}
          <div className="flex-1 text-sm leading-relaxed px-4">
            {currentStep.narrative}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 flex-none">
            <button
              onClick={onPrevious}
              disabled={isFirst}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/20 transition-all font-medium text-sm shadow-sm"
              title={isFirst ? "Already at first step" : "Previous step"}
            >
              ← Previous
            </button>
            <button
              onClick={onNext}
              disabled={isLast}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/20 transition-all font-medium text-sm shadow-sm"
              title={isLast ? "Already at last step" : "Next step"}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
