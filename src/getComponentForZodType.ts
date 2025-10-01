import type * as z from "zod";
import type { FormComponentMapping } from "./createSchemaForm";
import { isZodTypeEqual } from "./isZodTypeEqual";
import type { RTFSupportedZodTypes } from "./supportedZodTypes";
import { unwrapEffects } from "./unwrap";

export function getComponentForZodType(
	zodType: RTFSupportedZodTypes | z.ZodTransform | z.ZodPipe,
	mapping: FormComponentMapping,
) {
	for (const mappingElement of mapping) {
		if (
			isZodTypeEqual(unwrapEffects(zodType), unwrapEffects(mappingElement[0]))
		)
			return mappingElement[1];
	}
	return;
}
