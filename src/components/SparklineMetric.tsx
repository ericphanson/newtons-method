import React from 'react';

interface SparklineThreshold {
  value: number;
  color?: string;
  dash?: string;
  opacity?: number;
}

interface SparklineMetricProps {
  label: React.ReactNode;
  value: React.ReactNode;
  data: number[];
  currentIndex?: number;
  thresholds?: SparklineThreshold[];
  strokeColor?: string;
  markerColor?: string;
  onPointSelect?: (index: number) => void;
}

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 20;
const TOP_PADDING = 2;
const BOTTOM_PADDING = 2;
const DRAW_HEIGHT = VIEW_HEIGHT - TOP_PADDING - BOTTOM_PADDING; // 16px plot height

export const SparklineMetric: React.FC<SparklineMetricProps> = ({
  label,
  value,
  data,
  currentIndex,
  thresholds = [],
  strokeColor = '#3b82f6',
  markerColor = '#ef4444',
  onPointSelect,
}) => {
  const hasSparkline = data && data.length > 1;

  const safeIndex = currentIndex !== undefined
    ? Math.max(0, Math.min(data.length - 1, currentIndex))
    : undefined;

  const [minValue, maxValue] = React.useMemo(() => {
    if (!data || data.length === 0) return [0, 1];
    const minVal = Math.min(...data);
    let maxVal = Math.max(...data);
    if (minVal === maxVal) {
      maxVal = minVal + 1;
    }
    return [minVal, maxVal];
  }, [data]);

  const valueToY = (val: number) => {
    const ratio = (val - minValue) / (maxValue - minValue || 1);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const y = VIEW_HEIGHT - BOTTOM_PADDING - clampedRatio * DRAW_HEIGHT;
    return Math.max(TOP_PADDING, Math.min(VIEW_HEIGHT - BOTTOM_PADDING, y));
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPointSelect || !hasSparkline) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const idx = Math.round(ratio * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, idx));
    onPointSelect(clampedIndex);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-mono font-bold">{value}</span>
      </div>
      {hasSparkline && (
        <svg
          width="100%"
          height="24"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="overflow-visible cursor-pointer"
          onClick={handleClick}
        >
          {thresholds.map((threshold, idx) => (
            <line
              key={`threshold-${idx}`}
              x1="0"
              x2={VIEW_WIDTH}
              y1={valueToY(threshold.value)}
              y2={valueToY(threshold.value)}
              stroke={threshold.color ?? '#f59e0b'}
              strokeWidth="0.3"
              strokeDasharray={threshold.dash ?? '2,2'}
              vectorEffect="non-scaling-stroke"
              opacity={threshold.opacity ?? 0.6}
            />
          ))}
          <path
            d={data
              .map((val, i) => {
                const x = (i / Math.max(data.length - 1, 1)) * VIEW_WIDTH;
                const y = valueToY(val);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          {safeIndex !== undefined && data.length > safeIndex && (
            <circle
              cx={(safeIndex / Math.max(data.length - 1, 1)) * VIEW_WIDTH}
              cy={valueToY(data[safeIndex])}
              r="1"
              fill={markerColor}
              stroke="#fff"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}
    </div>
  );
};
