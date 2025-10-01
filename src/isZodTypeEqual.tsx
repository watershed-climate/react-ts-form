// biome-ignore-all lint: all is well
import type {
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
} from "zod";
import * as z from "zod";
import type { RTFSupportedZodTypes } from "./supportedZodTypes";
import { unwrap } from "./unwrap";

export function isZodTypeEqual(
  _a: RTFSupportedZodTypes,
  _b: RTFSupportedZodTypes
) {
  // Recursively check objects
  // if typeNames are equal Unwrap Appropriate Types:
  // optional

  const { type: a, _rtf_id: idA } = unwrap(_a);
  const { type: b, _rtf_id: idB } = unwrap(_b);

  if (idA || idB) {
    return idA === idB;
  }

  if (a.constructor !== b.constructor) return false;

  if (a instanceof z.ZodArray && b instanceof z.ZodArray) {
    if (isZodTypeEqual(a._zod.def.element, b._zod.def.element)) return true;
    return false;
  }

  if (a instanceof z.ZodSet && b instanceof z.ZodSet) {
    if (isZodTypeEqual(a._zod.def.valueType, b._zod.def.valueType)) return true;
    return false;
  }

  if (a instanceof z.ZodMap && b instanceof z.ZodMap) {
    if (
      isZodTypeEqual(a._zod.def.keyType, b._zod.def.keyType) &&
      isZodTypeEqual(
        a._zod.def.valueType as RTFSupportedZodTypes,
        b._zod.def.valueType as RTFSupportedZodTypes
      )
    )
      return true;

    return false;
  }

  if (a instanceof z.ZodRecord && b instanceof z.ZodRecord) {
    if (isZodTypeEqual(a._zod.def.valueType, b._zod.def.valueType)) return true;
    return false;
  }

  if (a instanceof z.ZodTuple && b instanceof z.ZodTuple) {
    const itemsA = a._def.items;
    const itemsB = b._def.items;
    if (itemsA.length !== itemsB.length) return false;
    for (let i = 0; i < itemsA.length; i++) {
      if (
        !isZodTypeEqual(
          itemsA[i] as RTFSupportedZodTypes,
          itemsB[i] as RTFSupportedZodTypes
        )
      )
        return false;
    }
    return true;
  }

  // Recursively check if objects are equal
  if (a instanceof z.ZodObject && b instanceof z.ZodObject) {
    const shapeA = a._zod.def.shape;
    const shapeB = b._zod.def.shape;
    if (!shapeA || !shapeB) {
      if (!shapeA && !shapeB) return true;
      return false;
    }
    const keysA = Object.keys(shapeA);
    const keysB = Object.keys(shapeB);
    const setA = new Set(keysA);
    const setB = new Set(keysB);

    for (const key of keysB) {
      if (!setA.has(key)) return false;
    }

    for (const key of keysA) {
      if (!setB.has(key)) return false;
    }

    for (var key of keysA) {
      const valA = shapeA[key];
      const valB = shapeB[key];
      if (!valB || !isZodTypeEqual(valA, valB)) return false;
    }
  }

  return true;
}

// Guards

export function isZodString(
  zodType: RTFSupportedZodTypes
): zodType is ZodString {
  return isTypeOf(zodType, "ZodString");
}

export function isZodNumber(
  zodType: RTFSupportedZodTypes
): zodType is ZodNumber {
  return isTypeOf(zodType, "ZodNumber");
}

export function isZodBoolean(
  zodType: RTFSupportedZodTypes
): zodType is ZodBoolean {
  return isTypeOf(zodType, "ZodBoolean");
}

export function isZodArray(
  zodType: RTFSupportedZodTypes
): zodType is ZodArray<any> {
  return isTypeOf(zodType, "ZodArray");
}

export function isZodObject(
  zodType: RTFSupportedZodTypes
): zodType is ZodObject<any> {
  return isTypeOf(zodType, "ZodObject");
}

export function isZodDefaultDef(
  zodDef: unknown
): zodDef is { defaultValue: () => any } {
  return Boolean(
    zodDef &&
      typeof zodDef === "object" &&
      "defaultValue" in zodDef &&
      typeof zodDef.defaultValue === "function"
  );
}

export function isZodDate(zodType: RTFSupportedZodTypes): zodType is ZodDate {
  return isTypeOf(zodType, "ZodDate");
}

export function isTypeOf(zodType: RTFSupportedZodTypes, type: ZodKindName) {
  switch (type) {
    case "ZodString":
      return zodType instanceof z.ZodString;
    case "ZodNumber":
      return zodType instanceof z.ZodNumber;
    case "ZodBoolean":
      return zodType instanceof z.ZodBoolean;
    case "ZodDate":
      return zodType instanceof z.ZodDate;
    case "ZodArray":
      return zodType instanceof z.ZodArray;
    case "ZodObject":
      return zodType instanceof z.ZodObject;
    case "ZodEnum":
      return zodType instanceof z.ZodEnum;
    case "ZodOptional":
      return zodType instanceof z.ZodOptional;
    case "ZodNullable":
      return zodType instanceof z.ZodNullable;
    default:
      return false;
  }
}

type ZodKindName =
  | "ZodString"
  | "ZodNumber"
  | "ZodBoolean"
  | "ZodDate"
  | "ZodArray"
  | "ZodObject"
  | "ZodEnum"
  | "ZodOptional"
  | "ZodNullable";

export type ZodKindNameToType<K extends ZodKindName> = K extends "ZodString"
  ? ZodString
  : K extends "ZodNumber"
  ? ZodNumber
  : K extends "ZodBoolean"
  ? ZodBoolean
  : K extends "ZodDate"
  ? ZodDate
  : K extends "ZodArray"
  ? ZodArray<any>
  : K extends "ZodObject"
  ? ZodObject<any>
  : K extends "ZodEnum"
  ? ZodEnum<any>
  : K extends "ZodOptional"
  ? ZodOptional<any>
  : K extends "ZodNullable"
  ? ZodNullable<any>
  : never;

export type RTFSupportedZodFirstPartyTypeKindMap = {
  [K in ZodKindName as ZodKindNameToType<K> extends RTFSupportedZodTypes
    ? K
    : never]: ZodKindNameToType<K>;
};

export type RTFSupportedZodFirstPartyTypeKind =
  keyof RTFSupportedZodFirstPartyTypeKindMap;
