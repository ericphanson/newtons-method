import React from 'react';

interface DataSeries {
  label: string;
  data: number[];
  color: string;
  strokeDasharray?: string;
}

interface LineChartProps {
  title: React.ReactNode;
  series: DataSeries[];
  currentIndex?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  onPointSelect?: (index: number) => void;
  height?: number;
  forcedYTicks?: number[]; // Force specific y-axis tick values to always appear
  transparentBackground?: boolean; // Use transparent background instead of white
  showLegend?: boolean; // Show legend for the series
  forceYMin?: number; // Force y-axis minimum value (e.g., 0 for non-negative data)
}

const VIEW_WIDTH = 600;

export const LineChart: React.FC<LineChartProps> = ({
  title,
  series,
  currentIndex,
  xAxisLabel = 'Iteration',
  yAxisLabel = 'Value',
  onPointSelect,
  height = 300,
  forcedYTicks = [],
  transparentBackground = false,
  showLegend = true,
  forceYMin,
}) => {
  const VIEW_HEIGHT = height;

  // Adjust margins based on whether legend is shown
  const MARGIN = showLegend
    ? { top: 20, right: 120, bottom: 40, left: 60 }
    : { top: 15, right: 20, bottom: 30, left: 55 };

  const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Find the maximum data length across all series
  const maxLength = Math.max(...series.map(s => s.data.length), 1);

  // Calculate y-axis bounds across all series
  const [minValue, maxValue] = React.useMemo(() => {
    const allValues = series.flatMap(s => s.data);
    // Include forced ticks in the range calculation
    const valuesWithForced = [...allValues, ...forcedYTicks];
    if (valuesWithForced.length === 0) return [0, 1];
    let minVal = Math.min(...valuesWithForced);
    let maxVal = Math.max(...valuesWithForced);

    // Add 10% padding to y-axis
    const range = maxVal - minVal;
    const padding = range * 0.1;
    minVal -= padding;
    maxVal += padding;

    // Apply forced minimum if specified
    if (forceYMin !== undefined) {
      minVal = Math.max(minVal, forceYMin);
    }

    if (minVal === maxVal) {
      maxVal = minVal + 1;
      minVal = minVal - 1;
    }
    return [minVal, maxVal];
  }, [series, forcedYTicks, forceYMin]);

  const valueToY = (val: number) => {
    const ratio = (val - minValue) / (maxValue - minValue || 1);
    return MARGIN.top + PLOT_HEIGHT * (1 - ratio);
  };

  const indexToX = (idx: number) => {
    return MARGIN.left + (idx / Math.max(maxLength - 1, 1)) * PLOT_WIDTH;
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPointSelect || maxLength === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const plotX = x - MARGIN.left;
    const ratio = plotX / PLOT_WIDTH;
    const idx = Math.round(ratio * (maxLength - 1));
    const clampedIndex = Math.max(0, Math.min(maxLength - 1, idx));
    onPointSelect(clampedIndex);
  };

  // Generate y-axis ticks
  const yTicks = React.useMemo(() => {
    const numTicks = 2;
    const ticks: number[] = [];
    for (let i = 0; i <= numTicks; i++) {
      const value = minValue + (i / numTicks) * (maxValue - minValue);
      ticks.push(value);
    }

    // Add forced ticks
    forcedYTicks.forEach(forcedTick => {
      // Only add if it's within the range and not too close to existing ticks
      if (forcedTick >= minValue && forcedTick <= maxValue) {
        const threshold = (maxValue - minValue) * 0.05; // 5% threshold
        const isTooClose = ticks.some(t => Math.abs(t - forcedTick) < threshold);
        if (!isTooClose) {
          ticks.push(forcedTick);
        }
      }
    });

    // Sort and remove duplicates
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [minValue, maxValue, forcedYTicks]);

  // Generate x-axis ticks
  const xTicks = React.useMemo(() => {
    const numTicks = Math.min(maxLength, 6);
    const ticks: number[] = [];
    for (let i = 0; i < numTicks; i++) {
      const idx = Math.round((i / (numTicks - 1)) * (maxLength - 1));
      ticks.push(idx);
    }
    return ticks;
  }, [maxLength]);

  return (
    <div className={showLegend ? "space-y-2" : "space-y-0"}>
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      <svg
        width="100%"
        height={VIEW_HEIGHT}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={`overflow-visible ${transparentBackground ? '' : 'border border-gray-200 rounded bg-white'} cursor-pointer`}
        onClick={handleClick}
      >
        {/* Y-axis */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + PLOT_HEIGHT}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* X-axis */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + PLOT_HEIGHT}
          x2={MARGIN.left + PLOT_WIDTH}
          y2={MARGIN.top + PLOT_HEIGHT}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* Y-axis ticks and grid */}
        {yTicks.map((tick, i) => {
          const y = valueToY(tick);
          const isForcedTick = forcedYTicks.includes(tick);
          return (
            <g key={`y-tick-${i}`}>
              {/* Grid line */}
              <line
                x1={MARGIN.left}
                y1={y}
                x2={MARGIN.left + PLOT_WIDTH}
                y2={y}
                stroke={isForcedTick ? '#9ca3af' : '#e5e7eb'}
                strokeWidth={isForcedTick ? '1' : '0.5'}
                strokeDasharray={isForcedTick ? '4,2' : '2,2'}
              />
              {/* Tick mark */}
              <line
                x1={MARGIN.left - 5}
                y1={y}
                x2={MARGIN.left}
                y2={y}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              {/* Label */}
              <text
                x={MARGIN.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill={isForcedTick ? '#374151' : '#6b7280'}
                fontWeight={isForcedTick ? '600' : 'normal'}
              >
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X-axis ticks */}
        {xTicks.map((tick, i) => {
          const x = indexToX(tick);
          return (
            <g key={`x-tick-${i}`}>
              {/* Tick mark */}
              <line
                x1={x}
                y1={MARGIN.top + PLOT_HEIGHT}
                x2={x}
                y2={MARGIN.top + PLOT_HEIGHT + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              {/* Label */}
              <text
                x={x}
                y={MARGIN.top + PLOT_HEIGHT + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* X-axis label */}
        <text
          x={MARGIN.left + PLOT_WIDTH / 2}
          y={VIEW_HEIGHT - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          fontWeight="500"
        >
          {xAxisLabel}
        </text>

        {/* Y-axis label */}
        <text
          x={15}
          y={MARGIN.top + PLOT_HEIGHT / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          fontWeight="500"
          transform={`rotate(-90, 15, ${MARGIN.top + PLOT_HEIGHT / 2})`}
        >
          {yAxisLabel}
        </text>

        {/* Plot data series */}
        {series.map((s, seriesIdx) => (
          <g key={`series-${seriesIdx}`}>
            {/* Line */}
            <path
              d={s.data
                .map((val, i) => {
                  const x = indexToX(i);
                  const y = valueToY(val);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.strokeDasharray}
            />

            {/* Points */}
            {s.data.map((val, i) => (
              <circle
                key={`point-${seriesIdx}-${i}`}
                cx={indexToX(i)}
                cy={valueToY(val)}
                r="2.5"
                fill={s.color}
                stroke="white"
                strokeWidth="1"
                opacity="0.8"
              />
            ))}
          </g>
        ))}

        {/* Current iteration marker */}
        {currentIndex !== undefined && currentIndex < maxLength && (
          <line
            x1={indexToX(currentIndex)}
            y1={MARGIN.top}
            x2={indexToX(currentIndex)}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.7"
          />
        )}

        {/* Legend */}
        {showLegend && series.map((s, i) => {
          const legendY = MARGIN.top + 20 + i * 20;
          const legendX = MARGIN.left + PLOT_WIDTH + 10;
          return (
            <g key={`legend-${i}`}>
              <line
                x1={legendX}
                y1={legendY}
                x2={legendX + 20}
                y2={legendY}
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.strokeDasharray}
              />
              <text
                x={legendX + 25}
                y={legendY}
                dominantBaseline="middle"
                fontSize="11"
                fill="#374151"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
