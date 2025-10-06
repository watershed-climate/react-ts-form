import * as z from "zod";

export function assertNever(x: never): never {
  throw new Error("[assertNever] Unexpected value: " + x);
}

export function unwrap(type: z.ZodType): z.ZodType {
  if (
    type instanceof z.ZodDefault ||
    type instanceof z.ZodOptional ||
    type instanceof z.ZodNullable ||
    type instanceof z.ZodLazy
  ) {
    // pass down meta props. passing down id will be a problem though since those must be unique
    const meta = type.meta();
    const unwrapped = type.unwrap() as z.ZodType;
    return unwrap(unwrapped.meta({ ...meta }));
  }

  return type;
}

type UnwrapPreviousLevel = [never, 0, 1, 2, 3];
type UnwrapMaxRecursionDepth = 3;
export type Unwrapped<
  T extends z.ZodType,
  Level extends number = UnwrapMaxRecursionDepth
> = Level extends never
  ? never
  : T extends z.ZodOptional | z.ZodNullable | z.ZodDefault
  ? ReturnType<T["unwrap"]> extends z.ZodType
    ? Unwrapped<ReturnType<T["unwrap"]>, UnwrapPreviousLevel[Level]>
    : ReturnType<T["unwrap"]>
  : T extends z.ZodArray
  ? T["element"] extends z.ZodType
    ? z.ZodArray<Unwrapped<T["element"], UnwrapMaxRecursionDepth>>
    : never
  : T extends z.ZodEnum
  ? z.ZodEnum<any>
  : T;
