import * as z from 'zod';
import { FormComponentMapping } from "./createSchemaForm";
export declare function getComponentForZodType(zodType: z.ZodType, mapping: FormComponentMapping): import("./createSchemaForm").ReactComponentWithRequiredProps<any> | undefined;
