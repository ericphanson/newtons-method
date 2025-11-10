// src/components/StoriesPage.tsx
import React from 'react';
import { allStories } from '../stories';

interface StoriesPageProps {
  onStartStory: (storyId: string) => void;
}

export const StoriesPage: React.FC<StoriesPageProps> = ({ onStartStory }) => {
  const stories = allStories;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stories</h1>
      <p className="text-gray-600 mb-8">
        Guided tours through optimization concepts using interactive examples.
      </p>

      {stories.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No stories available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold mb-2">{story.title}</h2>
              <p className="text-gray-700 mb-3">{story.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {story.steps.length} step{story.steps.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => onStartStory(story.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Story →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
