import * as z from "zod";
export declare function assertNever(x: never): never;
export declare function unwrap(type: z.ZodType): z.ZodType;
type UnwrapPreviousLevel = [never, 0, 1, 2, 3];
type UnwrapMaxRecursionDepth = 3;
export type Unwrapped<T extends z.ZodType, Level extends number = UnwrapMaxRecursionDepth> = Level extends never ? never : T extends z.ZodOptional | z.ZodNullable | z.ZodDefault ? ReturnType<T["unwrap"]> extends z.ZodType ? Unwrapped<ReturnType<T["unwrap"]>, UnwrapPreviousLevel[Level]> : ReturnType<T["unwrap"]> : T extends z.ZodArray ? T["element"] extends z.ZodType ? z.ZodArray<Unwrapped<T["element"], UnwrapMaxRecursionDepth>> : never : T extends z.ZodEnum ? z.ZodEnum<any> : T;
export {};
