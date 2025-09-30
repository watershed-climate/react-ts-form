// biome-ignore-all lint: all is well
import type * as z from "zod";

/**
 * Reducing this helps with TS performance
 */
export type RTFBaseZodType =
  | z.ZodString
  | z.ZodNumber
  | z.ZodBoolean
  | z.ZodDate
  | z.ZodArray<any>
  | z.ZodObject<any, any>
  | z.ZodDiscriminatedUnion<any, any>
  | z.ZodTuple<any, any>
  | z.ZodRecord<any, any>
  | z.ZodMap<any>
  | z.ZodSet<any>
  | z.ZodEnum<any>
  | z.ZodOptional<any>;

export type RTFSupportedZodTypes =
  | RTFBaseZodType
  | z.ZodOptional<any>
  | z.ZodDefault<any>
  | z.ZodNullable<any>;