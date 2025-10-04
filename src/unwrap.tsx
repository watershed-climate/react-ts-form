import * as z from 'zod';

export function assertNever(x: never): never {
  throw new Error("[assertNever] Unexpected value: " + x);
}

export function unwrap(
  type: z.ZodType
): z.ZodType {
  if (type instanceof z.ZodDefault || type instanceof z.ZodOptional || type instanceof z.ZodNullable || type instanceof z.ZodLazy) {
    // pass down meta props. passing down id will be a problem though since those must be unique
    const meta = type.meta();
    const unwrapped = type.unwrap() as z.ZodType;
    return unwrap(unwrapped.meta({...meta}));
  }


  return type;
}

// export type UnwrapPreviousLevel = [never, 0, 1, 2, 3];
// export type UnwrapMaxRecursionDepth = 3;

// /**
//  * At most we can see for a given type z.enum().optional().nullable().default("foo")
//  * so we limit recursion depth to 3
//  * then we can see the same again for the inner type of an array
//  * z.enum(["moo"]).optional().nullable().default('moo').array().optional().nullable().default(['moo'])
//  * so we restart the counter for array only, leaving us with a max of 6
//  * and ts seems ok with this because the type is very simple
//  */
// export type UnwrapZodType<
//   T extends RTFSupportedZodTypes,
//   Level extends UnwrapPreviousLevel[number] = UnwrapMaxRecursionDepth
// > = [Level] extends [never]
//   ? never
//   : T extends ZodOptional<any> | ZodNullable<any> | ZodDefault<any>
//   ? UnwrapZodType<T["_def"]["innerType"], UnwrapPreviousLevel[Level]>
//   : T extends ZodArray<any, any>
//   ? // allow another 4 levels of recursiion for the array
//     ZodArray<UnwrapZodType<T["element"], UnwrapMaxRecursionDepth>>
//   : T extends ZodEnum<any>
//   ? ZodEnum<any>
//   : T;
