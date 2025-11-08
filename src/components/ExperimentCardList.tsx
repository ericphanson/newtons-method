import React from 'react';
import { ExperimentPreset, ExperimentTone } from '../types/experiments';
import { LoadingSpinner } from './LoadingSpinner';

interface ExperimentCardListProps {
  experiments: ExperimentPreset[];
  experimentLoading: boolean;
  onLoadExperiment: (experiment: ExperimentPreset) => void;
}

const toneStyles: Record<
  ExperimentTone | 'gray',
  {
    border: string;
    bg: string;
    title: string;
    button: string;
    solidBg: string;
    solidHover: string;
    solidText: string;
  }
> = {
  green: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    title: 'text-green-900',
    button: 'text-green-600 hover:text-green-700',
    solidBg: 'bg-green-600',
    solidHover: 'hover:bg-green-700',
    solidText: 'text-white',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    title: 'text-red-900',
    button: 'text-red-600 hover:text-red-700',
    solidBg: 'bg-red-600',
    solidHover: 'hover:bg-red-700',
    solidText: 'text-white',
  },
  orange: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    title: 'text-orange-900',
    button: 'text-orange-600 hover:text-orange-700',
    solidBg: 'bg-orange-600',
    solidHover: 'hover:bg-orange-700',
    solidText: 'text-white',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    title: 'text-purple-900',
    button: 'text-purple-600 hover:text-purple-700',
    solidBg: 'bg-purple-600',
    solidHover: 'hover:bg-purple-700',
    solidText: 'text-white',
  },
  teal: {
    border: 'border-teal-200',
    bg: 'bg-teal-50',
    title: 'text-teal-900',
    button: 'text-teal-600 hover:text-teal-700',
    solidBg: 'bg-teal-600',
    solidHover: 'hover:bg-teal-700',
    solidText: 'text-white',
  },
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    title: 'text-blue-900',
    button: 'text-blue-600 hover:text-blue-700',
    solidBg: 'bg-blue-600',
    solidHover: 'hover:bg-blue-700',
    solidText: 'text-white',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    title: 'text-amber-900',
    button: 'text-amber-600 hover:text-amber-700',
    solidBg: 'bg-amber-600',
    solidHover: 'hover:bg-amber-700',
    solidText: 'text-white',
  },
  gray: {
    border: 'border-gray-200',
    bg: 'bg-gray-50',
    title: 'text-gray-900',
    button: 'text-gray-600 hover:text-gray-700',
    solidBg: 'bg-gray-600',
    solidHover: 'hover:bg-gray-700',
    solidText: 'text-white',
  },
};

export const ExperimentCardList: React.FC<ExperimentCardListProps> = ({
  experiments,
  experimentLoading,
  onLoadExperiment,
}) => {
  const experimentMap = React.useMemo(() => {
    const entries = new Map<string, ExperimentPreset>();
    experiments.forEach((exp) => {
      entries.set(exp.id, exp);
    });
    return entries;
  }, [experiments]);

  const visibleExperiments = React.useMemo(
    () => experiments.filter((exp) => !exp.ui?.hidden),
    [experiments]
  );

  return (
    <div className="space-y-3">
      {visibleExperiments.map((experiment) => {
        const tone = experiment.ui?.tone ?? 'gray';
        const styles = toneStyles[tone];
        const buttonClass = [
          styles.button,
          'font-bold',
          'text-lg',
          'disabled:opacity-50',
          experimentLoading ? 'cursor-wait' : 'cursor-pointer',
        ].join(' ');

        return (
          <div
            key={experiment.id}
            className={`border rounded p-3 ${styles.border} ${styles.bg}`}
          >
            <div className="flex items-start gap-2">
              <button
                className={buttonClass}
                onClick={() => onLoadExperiment(experiment)}
                disabled={experimentLoading}
                aria-label={`Load experiment: ${experiment.name}`}
              >
                {experimentLoading ? <LoadingSpinner /> : '▶'}
              </button>
              <div>
                <p className={`font-semibold ${styles.title}`}>{experiment.name}</p>
                <p className="text-sm text-gray-700">{experiment.description}</p>
                {experiment.ui?.details && (
                  <p className="text-sm text-gray-700 mt-1">{experiment.ui.details}</p>
                )}
                <p className="text-xs text-gray-600 mt-1 italic">{experiment.expectation}</p>
                {experiment.ui?.relatedActions?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {experiment.ui.relatedActions.map((action) => {
                      const related = experimentMap.get(action.targetId);
                      if (!related) return null;
                      const actionTone = toneStyles[action.tone ?? tone];
                      return (
                        <button
                          key={action.targetId}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${actionTone.solidBg} ${actionTone.solidHover} ${actionTone.solidText}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadExperiment(related);
                          }}
                          disabled={experimentLoading}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {experiment.ui?.footnote && (
                  <p className="text-xs text-gray-600 mt-2 italic">{experiment.ui.footnote}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

