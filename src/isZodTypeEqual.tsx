import * as z from "zod";
import { unwrap } from "./unwrap";

export function isZodTypeEqual(_a: z.ZodType, _b: z.ZodType, visited: Set<z.ZodType>) {
  // Recursively check objects
  // if typeNames are equal Unwrap Appropriate Types:
  // optional

  const a = unwrap(_a);
  const b = unwrap(_b);
  if (visited.has(a) && visited.has(b)) return true;
  visited.add(a);
  visited.add(b);


  const idA = a.meta()?.['_rtf_id'];
  const idB = b.meta()?.['_rtf_id'];

  if (idA || idB) {
    return idA === idB;
  }

  if (a.type !== b.type) return false;

  if (a instanceof z.ZodArray && b instanceof z.ZodArray) {
    if (
      isZodTypeEqual(
        a._zod.def.element as z.ZodType,
        b._zod.def.element as z.ZodType,
        visited
      )
    )
      return true;
    return false;
  }

  if (a instanceof z.ZodSet && b instanceof z.ZodSet) {
    if (
      isZodTypeEqual(
        a._zod.def.valueType as z.ZodType,
        b._zod.def.valueType as z.ZodType,
        visited
      )
    )
      return true;
    return false;
  }

  if (a instanceof z.ZodMap && b instanceof z.ZodMap) {
    if (
      isZodTypeEqual(
        a._zod.def.keyType as z.ZodType,
        b._zod.def.keyType as z.ZodType,
        visited
      ) &&
      isZodTypeEqual(
        a._zod.def.valueType as z.ZodType,
        b._zod.def.valueType as z.ZodType,
        visited
      )
    )
      return true;

    return false;
  }

  if (a instanceof z.ZodRecord && b instanceof z.ZodRecord) {
    if (
      isZodTypeEqual(
        a._zod.def.valueType as z.ZodType,
        b._zod.def.valueType as z.ZodType,
        visited
      )
    )
      return true;
    return false;
  }

  if (a instanceof z.ZodTuple && b instanceof z.ZodTuple) {
    const itemsA = a._def.items;
    const itemsB = b._def.items;
    if (itemsA.length !== itemsB.length) return false;
    for (let i = 0; i < itemsA.length; i++) {
      if (!isZodTypeEqual(itemsA[i] as z.ZodType, itemsB[i] as z.ZodType, visited)) {
        return false;
      }
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
      if (!valB || !isZodTypeEqual(valA, valB, visited)) return false;
    }
  }

  return true;
}
