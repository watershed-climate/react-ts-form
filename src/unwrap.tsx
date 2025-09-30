import * as z from "zod";
import {
  HIDDEN_ID_PROPERTY,
  isSchemaWithHiddenProperties,
} from "./createFieldSchema";
import type { RTFSupportedZodTypes } from "./supportedZodTypes";

export type UnwrappedRTFSupportedZodTypes = {
  type: RTFSupportedZodTypes;
  [HIDDEN_ID_PROPERTY]: string | null;
};

export function unwrap(
  type: RTFSupportedZodTypes
): UnwrappedRTFSupportedZodTypes {
  // Realized zod has a built in "unwrap()" function after writing this.
  // Not sure if it's super necessary.
  let r = type;
  let unwrappedHiddenId: null | string = null;

  while (
    r instanceof z.ZodOptional ||
    r instanceof z.ZodNullable ||
    r instanceof z.ZodDefault
  ) {
    console.log(r, r instanceof z.ZodOptional, r instanceof z.ZodNullable);
    if (isSchemaWithHiddenProperties(r)) {
      unwrappedHiddenId = r._zod.def[HIDDEN_ID_PROPERTY];
    }
    if (r instanceof z.ZodOptional) {
      r = r._zod.def.innerType;
    } else if (r instanceof z.ZodNullable) {
      r = r._zod.def.innerType;
    } else if (r instanceof z.ZodDefault) {
      r = r._zod.def.innerType;
    }
  }

  let innerHiddenId: null | string = null;

  if (isSchemaWithHiddenProperties(r)) {
    innerHiddenId = r._zod.def[HIDDEN_ID_PROPERTY];
  }

  return {
    type: r,
    [HIDDEN_ID_PROPERTY]: innerHiddenId || unwrappedHiddenId,
  };
}

export function unwrapEffects(schema: RTFSupportedZodTypes | z.ZodPipe | z.ZodTransform): RTFSupportedZodTypes {
  if (schema instanceof z.ZodPipe) {
    if (schema._zod.def.out instanceof z.ZodTransform) {
      return unwrapEffects(schema._zod.def.out);
    }
    return schema._zod.def.in as RTFSupportedZodTypes;
  }
  return schema as RTFSupportedZodTypes;
}


export type UnwrapPreviousLevel = [never, 0, 1, 2, 3];
export type UnwrapMaxRecursionDepth = 3;

/**
 * At most we can see for a given type z.enum().optional().nullable().default("foo")
 * so we limit recursion depth to 3
 * then we can see the same again for the inner type of an array
 * z.enum(["moo"]).optional().nullable().default('moo').array().optional().nullable().default(['moo'])
 * so we restart the counter for array only, leaving us with a max of 6
 * and ts seems ok with this because the type is very simple
 */
export type UnwrapZodType<
  T extends RTFSupportedZodTypes,
  Level extends UnwrapPreviousLevel[number] = UnwrapMaxRecursionDepth
> = [Level] extends [never]
  ? never
  : T extends z.ZodOptional<any> | z.ZodNullable<any> | z.ZodDefault<any>
  ? UnwrapZodType<T["def"]["innerType"], UnwrapPreviousLevel[Level]>
  : T extends z.ZodArray<any>
  ? // allow another 3 levels of recursion for the array
    z.ZodArray<UnwrapZodType<T["element"], UnwrapMaxRecursionDepth>>
  : T extends z.ZodEnum<any>
  ? z.ZodEnum<any>
  : T;