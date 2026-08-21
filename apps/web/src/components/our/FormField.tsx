"use client";

import React from "react";
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormFieldProps<T extends FieldValues, TName extends FieldPath<T>> {
  name: TName;
  control: Control<T>;
  label?: string;
  helperText?: string;
  required?: boolean;
  /** Aviso não-bloqueante exibido abaixo do campo (não impede o submit, diferente do erro de validação). */
  warning?: string | null;
  render: (props: {
    field: ControllerRenderProps<T, TName>;
    fieldState: ControllerFieldState;
    id: string;
  }) => React.ReactNode;
}

export function FormField<T extends FieldValues, TName extends FieldPath<T>>({
  name,
  control,
  label,
  helperText,
  required,
  warning,
  render,
}: FormFieldProps<T, TName>) {
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const rendered = render({ field, fieldState, id });
        const input = React.isValidElement(rendered)
          ? React.cloneElement(
              rendered as React.ReactElement<React.AriaAttributes>,
              {
                "aria-invalid": fieldState.invalid || undefined,
              },
            )
          : rendered;

        return (
          <Field className="min-w-0">
            {label && (
              <FieldLabel htmlFor={id}>
                <span className="text-muted-foreground">
                  {" "}
                  {label.toUpperCase()}{" "}
                </span>
                {required && <span className="text-destructive">*</span>}
                {helperText && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{helperText}</TooltipContent>
                  </Tooltip>
                )}
              </FieldLabel>
            )}
            {input}
            {fieldState.invalid ? (
              <div className="-mt-1 flex items-center gap-1.5">
                <CircleAlert className="h-4 w-4 shrink-0 text-destructive" />
                <FieldError className="text-xs" errors={[fieldState.error]} />
              </div>
            ) : warning ? (
              <div className="-mt-1 flex items-center gap-1.5">
                <TriangleAlert className="h-4 w-4 shrink-0 text-warning" />
                <span className="text-xs text-warning">{warning}</span>
              </div>
            ) : null}
          </Field>
        );
      }}
    />
  );
}
