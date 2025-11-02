"use client";

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EditableBasketTitleProps {
  basketId: string;
  currentName: string;
  onUpdate: (newName: string) => Promise<void>;
}

export default function EditableBasketTitle({ basketId, currentName, onUpdate }: EditableBasketTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value.trim() === '' || value === currentName) {
      setIsEditing(false);
      setValue(currentName);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(value.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update basket name:', error);
      setValue(currentName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(currentName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
          disabled={isLoading}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          title="Save"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-bold text-gray-900">{currentName}</h1>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        title="Rename basket"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
