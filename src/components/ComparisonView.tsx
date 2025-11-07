export interface ComparisonRun {
  name: string;
  iterations: Array<{ loss: number; gradNorm: number }>; // Algorithm-specific iteration type
  currentIter: number;
  color: string; // For visual distinction
}

interface ComparisonViewProps {
  left: ComparisonRun;
  right: ComparisonRun;
  onLeftIterChange: (iter: number) => void;
  onRightIterChange: (iter: number) => void;
}

/**
 * Side-by-side comparison view for two algorithm runs
 * Displays iteration controls and metrics for each algorithm
 */
export function ComparisonView({ left, right, onLeftIterChange, onRightIterChange }: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Left Algorithm */}
      <div className="border-2 border-blue-500 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-700 mb-3">{left.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Iteration:</span>
            <span className="font-mono">{left.currentIter + 1} / {left.iterations.length}</span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(0, left.iterations.length - 1)}
            value={left.currentIter}
            onChange={(e) => onLeftIterChange(Number(e.target.value))}
            className="w-full"
          />

          {left.iterations[left.currentIter] && (
            <>
              <div className="text-sm">
                <span className="font-medium">Loss:</span>{' '}
                <span className="font-mono">{left.iterations[left.currentIter].loss.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Gradient Norm:</span>{' '}
                <span className="font-mono">{left.iterations[left.currentIter].gradNorm.toFixed(6)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Algorithm */}
      <div className="border-2 border-green-500 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-700 mb-3">{right.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Iteration:</span>
            <span className="font-mono">{right.currentIter + 1} / {right.iterations.length}</span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(0, right.iterations.length - 1)}
            value={right.currentIter}
            onChange={(e) => onRightIterChange(Number(e.target.value))}
            className="w-full"
          />

          {right.iterations[right.currentIter] && (
            <>
              <div className="text-sm">
                <span className="font-medium">Loss:</span>{' '}
                <span className="font-mono">{right.iterations[right.currentIter].loss.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Gradient Norm:</span>{' '}
                <span className="font-mono">{right.iterations[right.currentIter].gradNorm.toFixed(6)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
