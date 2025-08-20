import * as React from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

export interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
}: TextareaFieldProps<T>) {
  return (
    <div className="space-y-2 rounded-lg">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <textarea
              id={field.name}
              {...field}
              placeholder={placeholder}
              disabled={disabled}
              className={
                "w-full p-3 rounded-lg border border-input bg-input text-base text-foreground shadow-sm placeholder:text-muted-foreground"
              + " focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              }
            />
            {fieldState.error && (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}