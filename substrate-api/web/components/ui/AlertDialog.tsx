"use client";

import * as React from "react";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="space-y-2 mb-4" {...props}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className="text-lg font-semibold text-gray-900" {...props}>
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="text-sm text-gray-600" {...props}>
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex justify-end gap-2 mt-6" {...props}>
      {children}
    </div>
  );
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AlertDialogAction({ children, className, ...props }: AlertDialogActionProps) {
  return (
    <button
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, className, ...props }: AlertDialogActionProps) {
  return (
    <button
      className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
