import React, { useContext, useEffect, useState } from "react";
import { createContext, ReactNode } from "react";
import {
  Control,
  DeepPartial,
  useController,
  UseControllerReturn,
} from "react-hook-form";
import { errorFromRhfErrorObject } from "./zodObjectErrors";
import { unwrap } from "./unwrap";

import * as z from 'zod';

export const FieldContext = createContext<null | {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  enumValues?: string[];
  zodType: z.ZodType;
  addToCoerceUndefined: (v: string) => void;
  removeFromCoerceUndefined: (v: string) => void;
}>(null);

export function FieldContextProvider({
  name,
  control,
  children,
  label,
  placeholder,
  enumValues,
  zodType,
  addToCoerceUndefined,
  removeFromCoerceUndefined,
}: {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  enumValues?: string[];
  children: ReactNode;
  zodType: z.ZodType;
  addToCoerceUndefined: (v: string) => void;
  removeFromCoerceUndefined: (v: string) => void;
}) {
  return (
    <FieldContext.Provider
      value={{
        control,
        name,
        label,
        placeholder,
        enumValues,
        zodType,
        addToCoerceUndefined,
        removeFromCoerceUndefined,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
}

export function useMaybeFieldName() {
  const context = useContext(FieldContext);
  return context?.name;
}

function useContextProt(name: string) {
  const context = useContext(FieldContext);
  if (!context)
    throw Error(
      `${name} must be called from within a FieldContextProvider... if you use this hook, the component must be rendered by @ts-react/form.`
    );
  return context;
}

/**
 * Allows working accessing and updating the form state for a field. Returns everything that a vanilla `react-hook-form` returns
 * `useController` call returns but with additional typesafety. Additionally, returns an `errors` object that provides a typesafe way
 * of dealing with nested react hook form errors.
 * @example
 * const {field: {onChange, value}, errors} = useTsController<string>()
 *
 * return (
 *  <>
 *    <input
 *      value={value}
 *      onChange={(e)=>onChange(e.target.value)}
 *    />
 *    {errors?.errorMessage && <span>{errors.errorMessage}</span>}
 *  </>
 * )
 */
export function useTsController<FieldType extends any>() {
  const context = useContextProt("useTsController");
  type IsObj = FieldType extends Object ? true : false;
  type OnChangeValue = IsObj extends true
    ? DeepPartial<FieldType> | undefined
    : FieldType | undefined;
  // Just gives better types to useController
  const controller = useController(context) as unknown as Omit<
    UseControllerReturn,
    "field"
  > & {
    field: Omit<UseControllerReturn["field"], "value" | "onChange"> & {
      value: FieldType | undefined;
      onChange: (value: OnChangeValue) => void;
    };
  };
  const {
    fieldState,
    field: { onChange, value },
  } = controller;
  const [isUndefined, setIsUndefined] = useState(false);

  function _onChange(value: OnChangeValue) {
    if (value === undefined) {
      setIsUndefined(true);
      context.addToCoerceUndefined(context.name);
    } else {
      setIsUndefined(false);
      context.removeFromCoerceUndefined(context.name);
      onChange(value);
    }
  }

  useEffect(() => {
    if (value && isUndefined) {
      setIsUndefined(false);
      context.removeFromCoerceUndefined(context.name);
    }
  }, [value]);

  return {
    ...controller,
    error: errorFromRhfErrorObject<FieldType>(fieldState.error),
    field: {
      ...controller.field,
      value: isUndefined ? undefined : controller.field.value,
      onChange: _onChange,
    },
  };
}

export function requiredDescriptionDataNotPassedError(
  name: string,
  hookName: string
) {
  return `No ${name} found when calling ${hookName}. Either pass it as a prop or pass it using the zod .describe() syntax.`;
}

/**
 * Gets the description `{label: string, placeholder: string}` for the field. Will return the description created via the zod .describe syntax.
 * description properties are optional, if you want to them to be required and throw an error when not passed, you may enjoy `useReqDescription()`;
 * @example
 * ```tsx
 * const {label, placeholder} = useDescription();
 *
 * return (
 *  <>
 *    <label>{label?label:'No label'}</label>}
 *    <input
 *      //...
 *
 *      placeholder={placeholder?placeholder:'No placeholder passed'}
 *    />
 *  </>
 * )
 * ```
 * @returns `{label: string, placeholder: string}`
 */
export function useDescription() {
  const { label, placeholder } = useContextProt("useReqDescription");
  return {
    label,
    placeholder,
  };
}

/**
 * Gets the description `{label: string, placeholder: string}` for the field. Throws an error if no label or placeholder is found.
 * If you don't want the error to throw, you may enjoy the `useDescription()` hook.
 * @example
 * ```tsx
 * const {label, placeholder} = useReqDescription();
 *
 * return (
 *  <>
 *    <label>{label}</label>}
 *    <input
 *      //...
 *
 *      placeholder={placeholder?placeholder:'No placeholder passed'}
 *    />
 *  </>
 * )
 * ```
 * @returns `{label: string, placeholder: string}`
 */
export function useReqDescription() {
  const { label, placeholder } = useContextProt("useReqDescription");
  if (!label) {
    throw new Error(
      requiredDescriptionDataNotPassedError("label", "useReqDescription")
    );
  }
  if (!placeholder) {
    throw new Error(
      requiredDescriptionDataNotPassedError("placeholder", "useReqDescription")
    );
  }
  return {
    label,
    placeholder,
  };
}

export function enumValuesNotPassedError() {
  return `Enum values not passed. Any component that calls useEnumValues should be rendered from an '.enum()' zod field.`;
}

export function fieldSchemaMismatchHookError(
  hookName: string,
  { expectedType, receivedType }: { expectedType: string; receivedType: string }
) {
  return `Make sure that the '${hookName}' hook is being called inside of a custom form component which matches the correct type.
  The expected type is '${expectedType}' but the received type was '${receivedType}'`;
}

/**
 * Gets an enum fields values. Throws an error if there are no enum values found (IE you mapped a z.string() to a component
 * that calls this hook).
 *
 * @example
 * ```tsx
 * const options = useEnumValues();
 *
 * return (
 *  <select>
 *    {options.map(e=>(
 *      <option
 *        value={e}
 *      >
 *        {titleCase(e)}
 *      </option>
 *    ))}
 *  </select>
 * )
 * ```
 */
export function useEnumValues() {
  const { enumValues } = useContextProt("useEnumValues");
  if (!enumValues) throw new Error(enumValuesNotPassedError());
  return enumValues;
}

function getFieldInfo(zodType: z.ZodType) {
  const type = unwrap(zodType);

  function getDefaultValue() {
    if (zodType instanceof z.ZodDefault) {
      const defaultValue = (zodType as z.ZodDefault)._zod.def.defaultValue;
      return defaultValue;
    }
    return undefined;
  }

  return {
    type,
    zodType,
    uniqueId: type.meta()?.['_rtf_id'],
    isOptional: z.safeParse(zodType, undefined).success,
    isNullable: z.safeParse(zodType, null).success,
    defaultValue: getDefaultValue(),
  };
}

/**
 * @internal
 */
export function internal_useFieldInfo(hookName: string) {
  const { zodType, label, placeholder } = useContextProt(hookName);

  const fieldInfo = getFieldInfo(zodType);

  return { ...fieldInfo, label, placeholder };
}

/**
 * Returns schema-related information for a field
 *
 * @returns The Zod type for the field.
 */
export function useFieldInfo() {
  return internal_useFieldInfo("useFieldInfo");
}

/**
 * The zod type objects contain virtual properties which requires us to
 * manually pick the properties we'd like inorder to get their values.
 */
// export function usePickZodFields<
//   TPick extends Partial<
//     PickPrimitiveObjectProperties<z.ZodType, true>
//   > = Partial<PickPrimitiveObjectProperties<z.ZodType, true>>
// >(type: z.ZodType, pick: TPick, hookName: string) {
//   const fieldInfo = internal_useFieldInfo(
//     hookName
//   );

//   function getType() {
//     const { type } = fieldInfo;

//     if (type instanceof z.ZodArray) {
//       const element = type.element;
//       return element as z.ZodType;
//     }

//     return type;
//   }

//   const fieldInfoType = getType();

//   if (fieldInfoType._zod.def.type !== type._zod.def.type) {
//     throw new Error(
//       fieldSchemaMismatchHookError(hookName, {
//         expectedType: fieldInfoType._zod.def.type,
//         receivedType: type._zod.def.type,
//       })
//     );
//   }

//   return {
//     ...pickPrimitiveObjectProperties<typeof type, TPick>(type, pick),
//     ...fieldInfo,
//   };
// }

/**
 * Returns schema-related information for a ZodString field
 *
 * @example
 * ```tsx
 * const CustomComponent = () => {
 *   const { minLength, maxLength, uniqueId } = useStringFieldInfo();
 *
 *   return <input minLength={minLength} maxLength={maxLength} />;
 * };
 * ```
 * @returns Information for a ZodString field
 */
// export function useStringFieldInfo() {
//   const fieldInfo = internal_useFieldInfo(
//     "useStringFieldInfo"
//   );

//   const type = fieldInfo.type instanceof z.ZodArray ? fieldInfo.type.element : fieldInfo.type;

//   if (fieldInfo.type._zod.def.type !== type._zod.def.type) {
//     throw new Error(
//       fieldSchemaMismatchHookError("useStringFieldInfo", {
//         expectedType: fieldInfo.type._zod.def.type,
//         receivedType: type._zod.def.type,
//       })
//     );
//   }

//   z.string()
//   return usePickZodFields(
//     z.string(),
//     {
//       description: true,
//       isCUID: true,
//       isCUID2: true,
//       isDatetime: true,
//       isEmail: true,
//       isEmoji: true,
//       isIP: true,
//       isULID: true,
//       isURL: true,
//       isUUID: true,
//       maxLength: true,
//       minLength: true,
//     },
//     "useStringFieldInfo"
//   );
// }

/**
 * Returns schema-related information for a ZodArray field
 *
 * @example
 * ```tsx
 * const CustomComponent = () => {
 *   const { description } = useArrayFieldInfo();
 *   return <p>{description}</p>;
 * };
 * ```
 * @returns Information for a ZodArray field
 */
// export function useArrayFieldInfo() {
//   return usePickZodFields(
//     z.any().array(),
//     {
//       description: true,
//     },
//     "useArrayFieldInfo"
//   );
// }

/**
 * Returns schema-related information for a ZodDate field
 *
 * @example
 * ```tsx
 * const CustomComponent = () => {
 *   const { description, maxDate, minDate } = useDateFieldInfo();
 *   return <input type="date" min={minDate} max={maxDate} />;
 * };
 * ```
 * @returns Information for a ZodDate field
 */
// export function useDateFieldInfo() {
//   const result = usePickZodFields(
//     z.date(),
//     {
//       description: true,
//       maxDate: true,
//       minDate: true,
//     },
//     "useDateFieldInfo"
//   );
//   return {
//     ...result,
//     maxDate: (result.type as z.ZodDate)._zod.bag.maximum,
//     minDate: (result.type as z.ZodDate)._zod.bag.minimum,
//   };
// }

/**
 * Returns schema-related information for a ZodNumber field
 *
 * @example
 * ```tsx
 * const CustomComponent = () => {
 *   const {
 *     description,
 *     isFinite,
 *     isInt,
 *     maxValue,
 *     minValue
 *   } = useNumberFieldInfo();
 *   return <input type="number" min={minValue} max={maxValue} />;
 * };
 * ```
 * @returns Information for a ZodDate field
 */
// export function useNumberFieldInfo() {
//   return usePickZodFields(
//     z.number(),
//     {
//       description: true,
//       isFinite: true,
//       isInt: true,
//       maxValue: true,
//       minValue: true,
//     },
//     "useNumberFieldInfo"
//   );
// }
