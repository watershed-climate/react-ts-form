import * as z from "zod";
import type { RTFSupportedZodTypes } from "./supportedZodTypes";
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

export function getEnumValues(type: RTFSupportedZodTypes) {
  if (!(type instanceof z.ZodEnum)) return;
  return type.options as readonly string[];
}

function isSchemaWithUnwrapMethod(
  schema: object
): schema is { unwrap: () => RTFSupportedZodTypes } {
  return "unwrap" in schema;
}

function recursivelyGetDescription(type: RTFSupportedZodTypes) {
  const t = type;
  const description = t.meta()?.description;

  if (description) return description;
  if (isSchemaWithUnwrapMethod(t)) {
    return recursivelyGetDescription(t.unwrap());
  }
  return;
}

export function getMetaInformationForZodType(type: RTFSupportedZodTypes) {
  // TODO - Maybe figure out how to not call unwrap here? Seems wasteful calling it twice... probably doesn't matter though.
  const unwrapped = unwrap(type);
  const description = recursivelyGetDescription(type);
  return {
    description: parseDescription(description),
    enumValues: getEnumValues(unwrapped.type),
  };
}
