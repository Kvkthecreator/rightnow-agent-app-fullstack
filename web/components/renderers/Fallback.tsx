import React from "react";

interface FallbackProps {
  data: any;
  error?: Error | null; // Optional error prop
}

export default function Fallback({ data, error }: FallbackProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {error
          ? "Error rendering component. Received data:"
          : "Unsupported output type or error in component. Received data:"}
      </p>
      {error && (
        <pre className="text-sm bg-red-100 text-red-700 p-2 rounded mt-2 whitespace-pre-wrap break-all">
          Error: {error.message}
        </pre>
      )}
      <pre className="text-sm bg-gray-100 p-2 rounded mt-2 whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}