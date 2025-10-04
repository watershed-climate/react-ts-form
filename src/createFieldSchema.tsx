import * as z from "zod";

export function duplicateIdErrorMessage(id: string) {
  return `Duplicate id passed to createFieldSchema: ${id}. Ensure that each id is only being used once and that createFieldSchema is only called at the top level.`;
}

/**
 * Creates a schema that will map to a unique component. This can be used when you want multiple of the same zod type to map to different React Components
 * @example
 * ```tsx
 * const MyUniqueSchema = createUniqueFieldSchema(z.string(), "any-unique-string");
 * const mapping = [
 *  [MyUniqueSchema, AComponent] as const
 * ] as const;
 * //...
 * <MyForm
 *  schema={z.object({
 *    field: MyUniqueSchema // this will render to AComponent
 *  })}
 * />
 * ```
 * @param schema A zod schema.
 * @param id A unique id string (this can be anything but needs to be explcitily passed).
 * @returns A normal zod schema that will be uniquely identified in the zod-component mapping.
 */
export function createUniqueFieldSchema<
  T extends z.ZodType,
  Identifier extends string
>(schema: T, id: Identifier): T {
  return schema.meta({"_rtf_id": id});
}
