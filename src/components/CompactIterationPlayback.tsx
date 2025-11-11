import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactIterationPlaybackProps {
  currentIter: number;
  totalIters: number;
  onIterChange: (iter: number) => void;
}

export const CompactIterationPlayback: React.FC<CompactIterationPlaybackProps> = ({
  currentIter,
  totalIters,
  onIterChange,
}) => {
  const handlePrevious = () => {
    if (currentIter > 0) {
      onIterChange(currentIter - 1);
    }
  };

  const handleNext = () => {
    if (currentIter < totalIters) {
      onIterChange(currentIter + 1);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 border-t border-gray-200">
      {/* Label with counter */}
      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
        Iteration {currentIter} / {totalIters}
      </span>

      {/* Navigation buttons grouped together */}
      <div className="flex items-center gap-0.5">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentIter === 0}
          className={`p-1 rounded transition-colors ${
            currentIter === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          title="Previous iteration"
          aria-label="Previous iteration"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentIter === totalIters}
          className={`p-1 rounded transition-colors ${
            currentIter === totalIters
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          title="Next iteration"
          aria-label="Next iteration"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max={totalIters}
        value={currentIter}
        onChange={(e) => onIterChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentIter / totalIters) * 100}%, #d1d5db ${(currentIter / totalIters) * 100}%, #d1d5db 100%)`
        }}
      />
    </div>
  );
};
