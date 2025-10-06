import { z } from "zod";
export declare const SPLIT_DESCRIPTION_SYMBOL = " // ";
export declare function parseDescription(description?: string): {
    label: string;
    placeholder: string | undefined;
} | undefined;
export declare function getEnumValues(type: z.ZodType): string[] | undefined;
export declare function getMetaInformationForZodType(type: z.ZodType): {
    description: {
        label: string;
        placeholder: string | undefined;
    } | undefined;
    enumValues: string[] | undefined;
};
