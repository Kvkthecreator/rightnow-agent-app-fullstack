"use client";

import { useState } from "react";
import ConversationInterface from "./ConversationInterface";
import { InterviewResponse, BusinessContext } from "./OnboardingAgent";

interface InterviewQuestion {
  id: string;
  question: string;
  placeholder: string;
  helpText?: string;
  followUp?: string;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "challenge",
    question: "What's the main business challenge or project you're working on?",
    placeholder: "e.g., Launching a new product, improving customer retention, analyzing market trends...",
    helpText: "This helps me understand the focus of your workspace",
    followUp: "Great! That gives me a clear picture of what you're working on."
  },
  {
    id: "businessType", 
    question: "What type of business or organization is this for?",
    placeholder: "e.g., Tech startup, retail company, consulting firm, non-profit...",
    helpText: "I'll use this to structure your workspace appropriately",
    followUp: "Perfect! I can tailor the workspace structure for your industry."
  },
  {
    id: "stakeholders",
    question: "Who are the key stakeholders or audience for this project?",
    placeholder: "e.g., Executive team, customers, investors, internal teams...",
    helpText: "Understanding your audience helps organize information effectively",
    followUp: "Excellent! I'll organize information with these stakeholders in mind."
  },
  {
    id: "existingInfo",
    question: "What information or data do you already have about this challenge?",
    placeholder: "e.g., Market research, customer feedback, competitor analysis, internal reports...",
    helpText: "This helps me create relevant document templates and analysis",
    followUp: "That's helpful context! I'll create documents that build on what you have."
  },
  {
    id: "successCriteria",
    question: "What would success look like for this project?",
    placeholder: "e.g., 20% increase in sales, successful product launch, improved efficiency...",
    helpText: "Success criteria help focus the intelligence and analysis",
    followUp: "Perfect! I have everything I need to create your intelligent workspace."
  }
];

interface Props {
  onComplete: (responses: InterviewResponse[], context: BusinessContext) => void;
  isProcessing: boolean;
}

export default function InterviewFlow({ onComplete, isProcessing }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'agent' | 'user';
    content: string;
    timestamp: number;
  }>>([
    {
      type: 'agent',
      content: "Hi! I'm here to help you create an intelligent workspace tailored to your business needs. I'll ask you 5 quick questions to understand your project, then create a complete workspace with AI-powered insights. Let's get started!",
      timestamp: Date.now()
    }
  ]);

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1;

  const handleResponse = (response: string) => {
    if (!response.trim()) return;

    const interviewResponse: InterviewResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      response: response.trim(),
      timestamp: Date.now()
    };

    const newResponses = [...responses, interviewResponse];
    setResponses(newResponses);

    // Add user response to conversation
    const updatedHistory = [
      ...conversationHistory,
      {
        type: 'user' as const,
        content: response.trim(),
        timestamp: Date.now()
      }
    ];

    // Add agent follow-up
    if (currentQuestion.followUp) {
      updatedHistory.push({
        type: 'agent' as const,
        content: currentQuestion.followUp,
        timestamp: Date.now() + 100
      });
    }

    setConversationHistory(updatedHistory);

    if (isLastQuestion) {
      // Complete the interview
      const businessContext: BusinessContext = {
        challenge: newResponses.find(r => r.questionId === 'challenge')?.response || '',
        businessType: newResponses.find(r => r.questionId === 'businessType')?.response || '',
        stakeholders: newResponses.find(r => r.questionId === 'stakeholders')?.response || '',
        existingInfo: newResponses.find(r => r.questionId === 'existingInfo')?.response || '',
        successCriteria: newResponses.find(r => r.questionId === 'successCriteria')?.response || ''
      };

      setTimeout(() => {
        onComplete(newResponses, businessContext);
      }, 1500); // Small delay to show the final follow-up
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setConversationHistory(prev => [
          ...prev,
          {
            type: 'agent',
            content: INTERVIEW_QUESTIONS[currentQuestionIndex + 1].question,
            timestamp: Date.now()
          }
        ]);
      }, 2000); // Delay to show follow-up before next question
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Remove the last response
      setResponses(responses.slice(0, -1));
      // Truncate conversation history appropriately
      // This is simplified - in a full implementation you'd want more sophisticated history management
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Processing Your Responses</h3>
        <p className="text-muted-foreground">
          I'm analyzing your input and creating a personalized workspace plan...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Interview Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Workspace Interview</h2>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / INTERVIEW_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Conversation Interface */}
      <ConversationInterface
        conversationHistory={conversationHistory}
        currentQuestion={currentQuestion}
        onResponse={handleResponse}
        onPrevious={currentQuestionIndex > 0 ? handlePrevious : undefined}
        isComplete={isLastQuestion && responses.length === INTERVIEW_QUESTIONS.length}
      />

      {/* Help Text */}
      {currentQuestion?.helpText && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 {currentQuestion.helpText}
          </p>
        </div>
      )}
    </div>
  );
}