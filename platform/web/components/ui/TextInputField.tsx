import * as React from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Input } from "./Input";

export interface TextInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TextInputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
}: TextInputFieldProps<T>) {
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
            <Input
              id={field.name}
              {...field}
              placeholder={placeholder}
              disabled={disabled}
            />
            {fieldState.error && (
              <p className="text-sm text-red-600">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}