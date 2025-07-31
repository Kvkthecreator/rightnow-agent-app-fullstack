"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Eye, Lightbulb, Settings } from "lucide-react";

interface ProgressiveDisclosureProps {
  story: string;
  reasoning?: string;
  substrate?: any;
  defaultLevel?: 'story' | 'reasoning' | 'substrate';
  className?: string;
}

export function ProgressiveDisclosure({ 
  story, 
  reasoning, 
  substrate, 
  defaultLevel = 'story',
  className = ""
}: ProgressiveDisclosureProps) {
  const [level, setLevel] = useState<'story' | 'reasoning' | 'substrate'>(defaultLevel);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasProgression = reasoning || substrate;

  return (
    <div className={`progressive-disclosure ${className}`}>
      {/* Always visible: Story level */}
      <div className="narrative-story mb-3">
        <div className="text-base text-gray-900 leading-relaxed">{story}</div>
      </div>
      
      {/* Progressive reveal controls - only if additional levels exist */}
      {hasProgression && (
        <div className="disclosure-controls">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>See how I know this</span>
          </button>
          
          {isExpanded && (
            <div className="mt-3 ml-6 space-y-3">
              {/* Level selection tabs */}
              <div className="flex gap-1">
                <button 
                  onClick={() => setLevel('story')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    level === 'story' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Story
                </button>
                {reasoning && (
                  <button 
                    onClick={() => setLevel('reasoning')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      level === 'reasoning' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Reasoning
                  </button>
                )}
                {substrate && (
                  <button 
                    onClick={() => setLevel('substrate')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      level === 'substrate' 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Technical
                  </button>
                )}
              </div>
              
              {/* Progressive content */}
              {level === 'reasoning' && reasoning && (
                <div className="narrative-reasoning p-4 bg-orange-50 border-l-4 border-orange-200 rounded-r-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Here's how I reached that conclusion:</h4>
                  <div className="text-orange-800 text-sm leading-relaxed">{reasoning}</div>
                </div>
              )}
              
              {level === 'substrate' && substrate && (
                <div className="technical-substrate p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Technical analysis details:
                  </h4>
                  <pre className="text-xs text-gray-600 overflow-auto bg-white p-2 rounded border max-h-40">
                    {JSON.stringify(substrate, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}