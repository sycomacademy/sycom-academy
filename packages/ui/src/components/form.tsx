import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { cn } from "@sycom-learn/ui/lib/utils";

function Form<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = undefined,
>({
  children,
  className,
  ...form
}: React.PropsWithChildren<
  UseFormReturn<TFieldValues, TContext, TTransformedValues> & { className?: string }
>) {
  return (
    <FormProvider {...form}>
      {className != null && className !== "" ? (
        <div className={cn(className)} data-slot="form-root">
          {children}
        </div>
      ) : (
        children
      )}
    </FormProvider>
  );
}

type FormFieldContextValue = {
  name: FieldPath<FieldValues>;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);
const FormItemContext = React.createContext<string | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={id}>
      <div className={cn("grid gap-2", className)} data-slot="form-item" {...props} />
    </FormItemContext.Provider>
  );
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemId = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext?.name ?? "" });

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  if (itemId === null) {
    throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    id: itemId,
    name: fieldContext.name,
    formItemId: `${itemId}-form-item`,
    formDescriptionId: `${itemId}-form-item-description`,
    formMessageId: `${itemId}-form-item-message`,
    ...fieldState,
  };
}

function FormControl({ children }: { children: React.ReactElement }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  const childProps = children.props as Record<string, unknown>;

  return React.cloneElement(children, {
    ...childProps,
    id: formItemId,
    "aria-describedby": error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
    "aria-invalid": !!error,
  } as never);
}

export { Form, FormField, FormItem, FormControl, useFormField };
