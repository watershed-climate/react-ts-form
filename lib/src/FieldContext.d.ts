import React from "react";
import { ReactNode } from "react";
import { Control, DeepPartial } from "react-hook-form";
import * as z from 'zod';
export declare const FieldContext: React.Context<{
    control: Control<any>;
    name: string;
    label?: string;
    placeholder?: string;
    enumValues?: string[];
    zodType: z.ZodType;
    addToCoerceUndefined: (v: string) => void;
    removeFromCoerceUndefined: (v: string) => void;
} | null>;
export declare function FieldContextProvider({ name, control, children, label, placeholder, enumValues, zodType, addToCoerceUndefined, removeFromCoerceUndefined, }: {
    name: string;
    control: Control<any>;
    label?: string;
    placeholder?: string;
    enumValues?: string[];
    children: ReactNode;
    zodType: z.ZodType;
    addToCoerceUndefined: (v: string) => void;
    removeFromCoerceUndefined: (v: string) => void;
}): JSX.Element;
export declare function useMaybeFieldName(): string | undefined;
export declare function useTsController<FieldType extends any>(): {
    error: import("./zodObjectErrors").RecursiveErrorType<FieldType> | undefined;
    field: {
        value: FieldType | undefined;
        onChange: (value: (FieldType extends Object ? true : false) extends true ? DeepPartial<FieldType> | undefined : FieldType | undefined) => void;
        name: string;
        disabled?: boolean | undefined;
        ref: import("react-hook-form").RefCallBack;
        onBlur: import("react-hook-form").Noop;
    };
    formState: import("react-hook-form").UseFormStateReturn<import("react-hook-form").FieldValues>;
    fieldState: import("react-hook-form").ControllerFieldState;
};
export declare function requiredDescriptionDataNotPassedError(name: string, hookName: string): string;
export declare function useDescription(): {
    label: string | undefined;
    placeholder: string | undefined;
};
export declare function useReqDescription(): {
    label: string;
    placeholder: string;
};
export declare function enumValuesNotPassedError(): string;
export declare function fieldSchemaMismatchHookError(hookName: string, { expectedType, receivedType }: {
    expectedType: string;
    receivedType: string;
}): string;
export declare function useEnumValues(): string[];
export declare function internal_useFieldInfo(hookName: string): {
    label: string | undefined;
    placeholder: string | undefined;
    type: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    zodType: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    uniqueId: unknown;
    isOptional: boolean;
    isNullable: boolean;
    defaultValue: unknown;
};
export declare function useFieldInfo(): {
    label: string | undefined;
    placeholder: string | undefined;
    type: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    zodType: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    uniqueId: unknown;
    isOptional: boolean;
    isNullable: boolean;
    defaultValue: unknown;
};
