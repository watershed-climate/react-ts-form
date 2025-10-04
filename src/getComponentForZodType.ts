import * as z from 'zod';
import { FormComponentMapping } from "./createSchemaForm";
import { isZodTypeEqual } from './isZodTypeEqual';


export function getComponentForZodType(
  zodType: z.ZodType,
  mapping: FormComponentMapping
) {
  for (const mappingElement of mapping) {
  if (isZodTypeEqual(zodType, mappingElement[0], new Set())) return mappingElement[1];
  }
  return;
}
