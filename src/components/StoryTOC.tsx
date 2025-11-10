// src/components/StoryTOC.tsx
import React from 'react';
import { Story } from '../stories/types';

interface StoryTOCProps {
  story: Story;
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onClose: () => void;
}

export const StoryTOC: React.FC<StoryTOCProps> = ({
  story,
  currentStepIndex,
  onSelectStep,
  onClose
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{story.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {story.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectStep(idx);
                onClose();
              }}
              className={`w-full text-left p-3 rounded transition-colors ${
                idx === currentStepIndex
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : idx < currentStepIndex
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Step {idx + 1}</span>
                {idx < currentStepIndex && <span className="text-green-600">✓</span>}
                {idx === currentStepIndex && <span className="text-blue-600">→</span>}
              </div>
              <p className="text-sm text-gray-600 mt-1">{step.narrative}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
