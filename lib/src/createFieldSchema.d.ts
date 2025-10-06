import * as z from "zod";
export declare function duplicateIdErrorMessage(id: string): string;
export declare function createUniqueFieldSchema<T extends z.ZodType, Identifier extends string>(schema: T, id: Identifier): T;
