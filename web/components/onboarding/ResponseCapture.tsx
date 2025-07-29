"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface Props {
  placeholder: string;
  onSubmit: (response: string) => void;
  onPrevious?: () => void;
}

export default function ResponseCapture({ placeholder, onSubmit, onPrevious }: Props) {
  const [response, setResponse] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the textarea when component mounts or question changes
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [placeholder]); // Re-focus when placeholder changes (new question)

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response);
      setResponse(""); // Clear input after submission
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = response.trim().length > 10; // Minimum response length

  return (
    <div className="space-y-4">
      {/* Response Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="min-h-[100px] resize-none pr-20"
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {response.length}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onPrevious && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="text-sm"
            >
              ← Previous
            </Button>
          )}
          
          {/* Response quality indicator */}
          {response.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${
                response.length < 10 ? 'bg-red-400' :
                response.length < 50 ? 'bg-yellow-400' :
                'bg-green-400'
              }`} />
              {response.length < 10 ? 'Please provide more detail' :
               response.length < 50 ? 'Good, more detail would help' :
               'Great detail!'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick tips */}
          <div className="text-xs text-muted-foreground hidden sm:block">
            Press Enter to continue
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-primary hover:bg-primary/90"
          >
            Continue →
          </Button>
        </div>
      </div>

      {/* Helpful prompts */}
      {response.length === 0 && (
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
          💡 <strong>Tip:</strong> The more detail you provide, the better I can tailor your workspace. 
          Think about specifics like goals, challenges, timelines, or key metrics.
        </div>
      )}

      {response.length > 0 && response.length < 20 && (
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          🎯 <strong>Almost there!</strong> A bit more detail will help me create a more personalized workspace for you.
        </div>
      )}
    </div>
  );
}