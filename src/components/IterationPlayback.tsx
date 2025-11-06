import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface IterationPlaybackProps {
  currentIter: number;
  totalIters: number;
  onIterChange: (iter: number) => void;
  onReset: () => void;
}

export const IterationPlayback: React.FC<IterationPlaybackProps> = ({
  currentIter,
  totalIters,
  onIterChange,
  onReset,
}) => {
  const handlePrevious = () => {
    if (currentIter > 0) {
      onIterChange(currentIter - 1);
    }
  };

  const handleNext = () => {
    if (currentIter < totalIters - 1) {
      onIterChange(currentIter + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Iteration Playback</h2>
        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded font-semibold">
          NAVIGATION
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        <button
          onClick={handlePrevious}
          disabled={currentIter === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
        >
          <ArrowLeft size={18} />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIter === totalIters - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
        >
          Next
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Timeline Scrubber */}
      <div className="mt-4">
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalIters - 1)}
            value={currentIter}
            onChange={(e) => onIterChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium text-gray-700 min-w-[60px]">
            {totalIters > 0 ? `${currentIter + 1} / ${totalIters}` : '0 / 0'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Drag to navigate through iterations (like a video timeline)
        </p>
      </div>
    </div>
  );
};
