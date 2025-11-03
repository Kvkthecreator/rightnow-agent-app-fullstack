import * as React from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

export interface Option {
  label: string;
  value: string;
}

export interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Option[];
  disabled?: boolean;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled,
}: SelectFieldProps<T>) {
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
            <select
              id={field.name}
              {...field}
              disabled={disabled}
              className={
                "w-full p-3 rounded-lg border border-input bg-input text-base text-foreground shadow-sm placeholder:text-muted-foreground"
              + " focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              }
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldState.error && (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}