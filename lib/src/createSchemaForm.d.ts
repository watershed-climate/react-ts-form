import React, { type ComponentProps, type ForwardRefExoticComponent, type ReactElement, type ReactNode, type RefAttributes } from "react";
import { type UseFormReturn, type Resolver, type UseFormSetError, type SubmitHandler, type DefaultValues } from "react-hook-form";
import * as z from "zod";
import type { DistributiveOmit, IndexOf, RequireKeysWithRequiredChildren } from "./typeUtilities";
import { Unwrapped } from "./unwrap";
export type ReactProps = Record<string, any>;
export type ReactComponentWithRequiredProps<Props extends ReactProps> = ((props: Props) => JSX.Element) | (ForwardRefExoticComponent<Props> & RefAttributes<unknown>);
export type MappingItem<PropType extends ReactProps> = readonly [
    z.ZodType,
    ReactComponentWithRequiredProps<PropType>
];
export type FormComponentMapping = readonly MappingItem<any>[];
export type MappableProp = "control" | "name" | "enumValues" | "descriptionLabel" | "descriptionPlaceholder";
export type PropsMapping = readonly (readonly [MappableProp, string])[];
export declare function noMatchingSchemaErrorMessage(propertyName: string, propertyType: string): string;
export declare function useFormResultValueChangedErrorMesssage(): string;
export type FormComponent = "form" | ((props: any) => JSX.Element);
export type ExtraProps = {
    beforeElement?: ReactNode;
    afterElement?: ReactNode;
};
declare const defaultPropsMap: readonly [readonly ["name", "name"], readonly ["control", "control"], readonly ["enumValues", "enumValues"]];
export type RTFFormSchemaType = z.ZodObject;
export type RTFFormSubmitFn<SchemaType extends Record<any, any>> = (values: SchemaType) => void | Promise<void>;
export type IndexOfSchemaInMapping<Mapping extends FormComponentMapping, SchemaType extends z.ZodObject, key extends keyof SchemaType["shape"]> = IndexOf<Mapping, readonly [Unwrapped<SchemaType["shape"][key]>, any]>;
export type GetTupleFromMapping<Mapping extends FormComponentMapping, SchemaType extends z.ZodObject, key extends keyof SchemaType["shape"]> = IndexOfSchemaInMapping<Mapping, SchemaType, key> extends never ? never : Mapping[IndexOfSchemaInMapping<Mapping, SchemaType, key>];
export type Prev = [never, 0, 1, 2, 3, 4];
export type MaxDefaultRecursionDepth = 1;
export type PropType<Mapping extends FormComponentMapping, SchemaType extends z.ZodType, PropsMapType extends PropsMapping = typeof defaultPropsMap, Level extends number = MaxDefaultRecursionDepth> = Level extends never ? never : SchemaType extends z.ZodObject ? RequireKeysWithRequiredChildren<Partial<{
    [key in keyof SchemaType["shape"]]: GetTupleFromMapping<Mapping, SchemaType, key> extends never ? SchemaType["shape"][key] extends z.ZodObject ? PropType<Mapping, SchemaType["shape"][key], PropsMapType, Prev[Level]> : SchemaType["shape"][key] extends z.ZodArray ? PropType<Mapping, SchemaType["shape"][key]["element"], PropsMapType, Prev[Level]> : never : GetTupleFromMapping<Mapping, SchemaType, key> extends readonly [
        any,
        any
    ] ? DistributiveOmit<ComponentProps<GetTupleFromMapping<Mapping, SchemaType, key>[1]>, PropsMapType[number][1]> & ExtraProps : never;
}>> : never;
export type RenderedFieldMap<SchemaType extends z.ZodObject, Level extends Prev[number] = MaxDefaultRecursionDepth> = [Level] extends [never] ? never : {
    [key in keyof SchemaType["shape"]]: SchemaType["shape"][key] extends z.ZodObject ? RenderedFieldMap<SchemaType["shape"][key], Prev[Level]> : SchemaType["shape"][key] extends z.ZodArray ? SchemaType["shape"][key]["element"] extends z.ZodObject ? RenderedFieldMap<SchemaType["shape"][key]["element"], Prev[Level]>[] : JSX.Element[] : JSX.Element;
};
export type CustomChildRenderProp<SchemaType extends RTFFormSchemaType> = (fieldMap: RenderedFieldMap<SchemaType>) => ReactElement<any, any> | null;
export type RTFFormSpecificProps<SchemaType extends z.ZodObject, FormType extends FormComponent = "form"> = {
    defaultValues?: DefaultValues<z.core.input<SchemaType>>;
    onSubmit: RTFFormSubmitFn<z.infer<SchemaType>>;
    renderAfter?: (vars: {
        submit: () => void;
    }) => ReactNode;
    renderBefore?: (vars: {
        submit: () => void;
    }) => ReactNode;
    form?: UseFormReturn<z.input<SchemaType>, any, z.output<SchemaType>>;
} & RequireKeysWithRequiredChildren<{
    formProps?: DistributiveOmit<ComponentProps<FormType>, "children" | "onSubmit">;
}>;
export type RTFSharedFormProps<Mapping extends FormComponentMapping, SchemaType extends z.ZodObject, PropsMapType extends PropsMapping = typeof defaultPropsMap> = {
    schema: SchemaType;
    children?: CustomChildRenderProp<SchemaType>;
} & RequireKeysWithRequiredChildren<{
    props?: PropType<Mapping, SchemaType, PropsMapType>;
}>;
export type RTFFormProps<Mapping extends FormComponentMapping, SchemaType extends z.ZodObject, PropsMapType extends PropsMapping = typeof defaultPropsMap, FormType extends FormComponent = "form"> = RTFSharedFormProps<Mapping, SchemaType, PropsMapType> & RTFFormSpecificProps<SchemaType, FormType>;
export type TsForm<Mapping extends FormComponentMapping, PropsMapType extends PropsMapping, FormType extends FormComponent> = <SchemaType extends z.ZodObject>(props: RTFFormProps<Mapping, SchemaType, PropsMapType, FormType>) => React.ReactElement<any, any>;
export type TsFormCreateOptions<FormType extends FormComponent, PropsMapType extends PropsMapping> = {
    FormComponent?: FormType;
    propsMap?: PropsMapType;
};
export declare function createTsForm<Mapping extends FormComponentMapping, PropsMapType extends PropsMapping = typeof defaultPropsMap, FormType extends FormComponent = "form">(componentMap: Mapping, options?: TsFormCreateOptions<FormType, PropsMapType>): TsForm<Mapping, PropsMapType, FormType>;
export declare function createTsFormAndFragment<Mapping extends FormComponentMapping, PropsMapType extends PropsMapping = typeof defaultPropsMap, FormType extends FormComponent = "form">(componentMap: Mapping, options?: TsFormCreateOptions<FormType, PropsMapType>): readonly [<SchemaType extends z.ZodObject>({ schema, onSubmit, props, formProps, defaultValues, renderAfter, renderBefore, form, children, }: RTFFormProps<Mapping, SchemaType, PropsMapType, FormType>) => JSX.Element, <SchemaType extends z.ZodObject>({ schema, props, children, schemaKey, }: RTFSharedFormProps<Mapping, SchemaType, PropsMapType> & {
    schemaKey?: string | number;
}) => JSX.Element, <Type extends z.ZodObject>(props: Pick<{
    schema: Type;
    props: Type extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? RequireKeysWithRequiredChildren<Partial<{ [key in keyof Type["shape"]]: GetTupleFromMapping<Mapping, Type, key> extends never ? Type["shape"][key] extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? Type["shape"][key] extends infer T ? T extends Type["shape"][key] ? T extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? RequireKeysWithRequiredChildren<Partial<{ [key_1 in keyof T["shape"]]: GetTupleFromMapping<Mapping, T, key_1> extends never ? T["shape"][key_1] extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? never : T["shape"][key_1] extends z.ZodArray<z.core.$ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>> ? never : never : GetTupleFromMapping<Mapping, T, key_1> extends readonly [any, any] ? DistributiveOmit<React.ComponentProps<(readonly [any, any] & GetTupleFromMapping<Mapping, T, key_1>)[1]>, PropsMapType[number][1]> & ExtraProps : never; }>> : never : never : never : Type["shape"][key] extends z.ZodArray<z.core.$ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>> ? Type["shape"][key]["element"] extends infer T_1 ? T_1 extends Type["shape"][key]["element"] ? T_1 extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? RequireKeysWithRequiredChildren<Partial<{ [key_2 in keyof T_1["shape"]]: GetTupleFromMapping<Mapping, T_1, key_2> extends never ? T_1["shape"][key_2] extends z.ZodObject<z.core.$ZodLooseShape, z.core.$strip> ? never : T_1["shape"][key_2] extends z.ZodArray<z.core.$ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>> ? never : never : GetTupleFromMapping<Mapping, T_1, key_2> extends readonly [any, any] ? DistributiveOmit<React.ComponentProps<(readonly [any, any] & GetTupleFromMapping<Mapping, T_1, key_2>)[1]>, PropsMapType[number][1]> & ExtraProps : never; }>> : never : never : never : never : GetTupleFromMapping<Mapping, Type, key> extends readonly [any, any] ? DistributiveOmit<React.ComponentProps<(readonly [any, any] & GetTupleFromMapping<Mapping, Type, key>)[1]>, PropsMapType[number][1]> & ExtraProps : never; }>> : never;
    schemaKey: string | number;
    form: UseFormReturn<Record<string, any>, any>;
    namePrefix: string | undefined;
    submitter: Submitter;
}, "schema" | "schemaKey"> & RequireKeysWithRequiredChildren<{
    props?: PropType<Mapping, Type, PropsMapType>;
}>) => JSX.Element];
declare function useSubmitter<SchemaType extends z.ZodObject>({ resolver, onSubmit, setError, }: {
    resolver: Resolver<z.input<SchemaType>, unknown, z.output<SchemaType>>;
    onSubmit: RTFFormSubmitFn<z.infer<SchemaType>>;
    setError: UseFormSetError<z.input<SchemaType>>;
}): {
    submit: SubmitHandler<any>;
    removeUndefined: (data: any) => any;
    removeFromCoerceUndefined: (fieldName: string) => void;
    addToCoerceUndefined: (fieldName: string) => void;
};
type Submitter = ReturnType<typeof useSubmitter>;
export declare function useSubmitterContext(): {
    submit: SubmitHandler<any>;
    removeUndefined: (data: any) => any;
    removeFromCoerceUndefined: (fieldName: string) => void;
    addToCoerceUndefined: (fieldName: string) => void;
};
export declare function SubmitterContextProvider({ children, ...submitter }: ReturnType<typeof useSubmitter> & {
    children: ReactNode;
}): JSX.Element;
export type RenderedElement = JSX.Element | JSX.Element[] | RenderedObjectElements | RenderedElement[];
export type RenderedObjectElements = {
    [key: string]: RenderedElement;
};
export declare function flattenRenderedElements(val: RenderedElement): JSX.Element[];
export {};
