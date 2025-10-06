import { z } from "zod";
import { unwrap } from "./unwrap";

export const SPLIT_DESCRIPTION_SYMBOL = " // ";

export function parseDescription(description?: string) {
  if (!description) return;
  const [label, ...rest] = description
    .split(SPLIT_DESCRIPTION_SYMBOL)
    .map((e) => e.trim());
  const placeholder = rest.join(SPLIT_DESCRIPTION_SYMBOL);
  return {
    label: label!,
    placeholder: placeholder ? placeholder : undefined,
  };
}

export function getEnumValues(type: z.ZodType): string[] | undefined {
  if (type instanceof z.ZodEnum) {
    return Object.keys(type.enum);
  }
  return;
}


// function recursivelyGetDescription(type: z.ZodType): string | undefined {
//   if (type instanceof z.ZodOptional || type instanceof z.ZodNullable || type instanceof z.ZodDefault || type instanceof z.ZodLazy) {
//     return recursivelyGetDescription(type.unwrap() as z.ZodType);
//   }
//   return type.meta()?.description;
// }

export function getMetaInformationForZodType(type: z.ZodType) {
  const unwrapped = unwrap(type);
  return {
    description: parseDescription(unwrapped.meta()?.description),
    enumValues: getEnumValues(unwrap(type)),
  };
}
