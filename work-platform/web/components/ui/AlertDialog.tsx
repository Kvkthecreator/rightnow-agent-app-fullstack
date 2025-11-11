"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
      className="bg-card text-card-foreground rounded-xl border border-border shadow-xl max-w-md w-full p-6"
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
    <h2 className="text-lg font-semibold text-foreground" {...props}>
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="text-sm text-muted-foreground" {...props}>
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
      className={cn(
        "px-4 py-2 rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, className, ...props }: AlertDialogActionProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md bg-muted text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
