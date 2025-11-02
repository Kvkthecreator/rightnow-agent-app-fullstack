import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
  title: string;
}

export function ErrorMessage({ error, onRetry, title }: ErrorMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-6">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-red-600">{title}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
        <Button 
          onClick={onRetry} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}