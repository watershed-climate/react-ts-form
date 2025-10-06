import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  type ComponentProps,
  createContext,
  type ForwardRefExoticComponent,
  Fragment,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  type ErrorOption,
  FormProvider,
  type UseFormReturn,
  useForm,
  useFormContext,
  type Resolver,
  type UseFormSetError,
  type SubmitHandler,
  type ResolverResult,
  type DefaultValues,
} from "react-hook-form";
import * as z from "zod";
import { duplicateIdErrorMessage } from "./createFieldSchema";
import { FieldContextProvider, useMaybeFieldName } from "./FieldContext";
import { getComponentForZodType } from "./getComponentForZodType";
import { getMetaInformationForZodType } from "./getMetaInformationForZodType";
import { isZodTypeEqual } from "./isZodTypeEqual";
import { duplicateTypeError, printWarningsForSchema } from "./logging";
import type {
  DistributiveOmit,
  IndexOf,
  RequireKeysWithRequiredChildren,
} from "./typeUtilities";
import { Unwrapped } from "./unwrap";

/**
 * @internal
 */
export type ReactProps = Record<string, any>;

/**
 * @internal
 */
export type ReactComponentWithRequiredProps<
  Props extends ReactProps
  // ExtraProps extends Record<string, any> = {}
> =
  | ((props: Props) => JSX.Element)
  | (ForwardRefExoticComponent<Props> & RefAttributes<unknown>);

export type MappingItem<PropType extends ReactProps> = readonly [
  z.ZodType,
  ReactComponentWithRequiredProps<PropType>
];

export type FormComponentMapping = readonly MappingItem<any>[];
export type MappableProp =
  | "control"
  | "name"
  | "enumValues"
  | "descriptionLabel"
  | "descriptionPlaceholder";
export type PropsMapping = readonly (readonly [MappableProp, string])[];

export function noMatchingSchemaErrorMessage(
  propertyName: string,
  propertyType: string
) {
  return `No matching zod schema for type \`${propertyType}\` found in mapping for property \`${propertyName}\`. Make sure there's a matching zod schema for every property in your schema.`;
}

export function useFormResultValueChangedErrorMesssage() {
  return `useFormResult prop changed - its value shouldn't changed during the lifetime of the component.`;
}

/**
 * @internal
 */
export type FormComponent = "form" | ((props: any) => JSX.Element);

export type ExtraProps = {
  /**
   * An element to render before the field.
   */
  beforeElement?: ReactNode;
  /**
   * An element to render after the field.
   */
  afterElement?: ReactNode;
};

function checkForDuplicateTypes(array: z.ZodType[]) {
  var combinations = array.flatMap((v, i) =>
    array.slice(i + 1).map((w) => [v, w] as const)
  );
  for (const [a, b] of combinations) {
    printWarningsForSchema(a);
    printWarningsForSchema(b);
    if (isZodTypeEqual(a!, b, new Set())) {
      duplicateTypeError();
    }
  }
}

function checkForDuplicateUniqueFields(array: z.ZodType[]) {
  const usedIdsSet = new Set<string>();
  for (const type of array) {
    const id = type.meta()?.["_rtf_id"] as string | undefined;
    if (id) {
      if (usedIdsSet.has(id)) throw new Error(duplicateIdErrorMessage(id));
      usedIdsSet.add(id);
    }
  }
}

const defaultPropsMap = [
  ["name", "name"] as const,
  ["control", "control"] as const,
  ["enumValues", "enumValues"] as const,
] as const;

function propsMapToObect(propsMap: PropsMapping) {
  const r: { [key in MappableProp]+?: string } = {};
  for (const [mappable, toProp] of propsMap) {
    r[mappable] = toProp;
  }
  return r;
}

export type RTFFormSchemaType = z.ZodObject;
export type RTFFormSubmitFn<SchemaType extends Record<any, any>> = (
  values: SchemaType
) => void | Promise<void>;

export type IndexOfSchemaInMapping<
  Mapping extends FormComponentMapping,
  SchemaType extends z.ZodObject,
  key extends keyof SchemaType["shape"]
> = IndexOf<Mapping, readonly [Unwrapped<SchemaType["shape"][key]>, any]>;

export type GetTupleFromMapping<
  Mapping extends FormComponentMapping,
  SchemaType extends z.ZodObject,
  key extends keyof SchemaType["shape"]
> = IndexOfSchemaInMapping<Mapping, SchemaType, key> extends never
  ? never
  : Mapping[IndexOfSchemaInMapping<Mapping, SchemaType, key>];

export type Prev = [never, 0, 1, 2, 3, 4];
export type MaxDefaultRecursionDepth = 1;
export type PropType<
  Mapping extends FormComponentMapping,
  SchemaType extends z.ZodType,
  PropsMapType extends PropsMapping = typeof defaultPropsMap,
  // this controls the depth we allow TS to go into the schema. 2 is enough for most cases, but we could consider exposing this as a generic to allow users to control the depth
  Level extends number = MaxDefaultRecursionDepth
> = Level extends never
  ? never
  : SchemaType extends z.ZodObject
  ? RequireKeysWithRequiredChildren<
      Partial<{
        [key in keyof SchemaType["shape"]]: GetTupleFromMapping<
          Mapping,
          SchemaType,
          key
        > extends never
          ? SchemaType["shape"][key] extends z.ZodObject
            ? PropType<
                Mapping,
                SchemaType["shape"][key],
                PropsMapType,
                Prev[Level]
              >
            : SchemaType["shape"][key] extends z.ZodArray
            ? PropType<
                Mapping,
                SchemaType["shape"][key]["element"],
                PropsMapType,
                Prev[Level]
              >
            : never
          : GetTupleFromMapping<Mapping, SchemaType, key> extends readonly [
              any,
              any
            ] // I guess this tells typescript it has a second element? errors without this check.
          ? DistributiveOmit<
              ComponentProps<GetTupleFromMapping<Mapping, SchemaType, key>[1]>,
              PropsMapType[number][1]
            > &
              ExtraProps
          : never;
      }>
    >
  : never;

export type RenderedFieldMap<
  SchemaType extends z.ZodObject,
  Level extends Prev[number] = MaxDefaultRecursionDepth
> = [Level] extends [never]
  ? never
  : {
      [key in keyof SchemaType["shape"]]: SchemaType["shape"][key] extends z.ZodObject
        ? RenderedFieldMap<SchemaType["shape"][key], Prev[Level]>
        : SchemaType["shape"][key] extends z.ZodArray
        ? SchemaType["shape"][key]["element"] extends z.ZodObject
          ? RenderedFieldMap<SchemaType["shape"][key]["element"], Prev[Level]>[]
          : JSX.Element[]
        : JSX.Element;
    };

export type CustomChildRenderProp<SchemaType extends RTFFormSchemaType> = (
  fieldMap: RenderedFieldMap<SchemaType>
) => ReactElement<any, any> | null;

export type RTFFormSpecificProps<
  SchemaType extends z.ZodObject,
  FormType extends FormComponent = "form"
> = {
  /**
   * Initializes your form with default values. Is a deep partial, so all properties and nested properties are optional.
   */
  defaultValues?: DefaultValues<z.core.input<SchemaType>>;
  /**
   * A callback function that will be called with the data once the form has been submitted and validated successfully.
   */
  onSubmit: RTFFormSubmitFn<z.infer<SchemaType>>;
  /**
   * A function that renders components after the form, the function is passed a `submit` function that can be used to trigger
   * form submission.
   * @example
   * ```tsx
   * <Form
   *   // ...
   *   renderAfter={({submit})=><button onClick={submit}>Submit</button>}
   * />
   * ```
   */
  renderAfter?: (vars: { submit: () => void }) => ReactNode;
  /**
   * A function that renders components before the form, the function is passed a `submit` function that can be used to trigger
   * form submission.
   * @example
   * ```tsx
   * <Form
   *   // ...
   *   renderBefore={({submit})=><button onClick={submit}>Submit</button>}
   * />
   * ```
   */
  renderBefore?: (vars: { submit: () => void }) => ReactNode;
  /**
   * Use this if you need access to the `react-hook-form` useForm() in the component containing the form component (if you need access to any of its other properties.)
   * This will give you full control over you form state (in case you need check if it's dirty or reset it or anything.)
   * @example
   * ```tsx
   * function Component() {
   *   const form = useForm();
   *   return <MyForm useFormResult={form}/>
   * }
   * ```
   */
  form?: UseFormReturn<z.input<SchemaType>, any, z.output<SchemaType>>;
} & RequireKeysWithRequiredChildren<{
  /**
   * Props to pass to the form container component (by default the props that "form" tags accept)
   */
  formProps?: DistributiveOmit<
    ComponentProps<FormType>,
    "children" | "onSubmit"
  >;
}>;

export type RTFSharedFormProps<
  Mapping extends FormComponentMapping,
  SchemaType extends z.ZodObject,
  PropsMapType extends PropsMapping = typeof defaultPropsMap
> = {
  /**
   * A Zod Schema - An input field will be rendered for each property in the schema, based on the mapping passed to `createTsForm`
   */
  schema: SchemaType;

  children?: CustomChildRenderProp<SchemaType>;
} & RequireKeysWithRequiredChildren<{
  /**
   * Props to pass to the individual form components. The keys of `props` will be the names of your form properties in the form schema, and they will
   * be typesafe to the form components in the mapping passed to `createTsForm`. If any of the rendered form components have required props, this is required.
   * @example
   * ```tsx
   * <MyForm
   *  schema={z.object({field: z.string()})}
   *  props={{
   *    field: {
   *      // TextField props
   *    }
   *  }}
   * />
   * ```
   */
  props?: PropType<Mapping, SchemaType, PropsMapType>;
}>;

export type RTFFormProps<
  Mapping extends FormComponentMapping,
  SchemaType extends z.ZodObject,
  PropsMapType extends PropsMapping = typeof defaultPropsMap,
  FormType extends FormComponent = "form"
> = RTFSharedFormProps<Mapping, SchemaType, PropsMapType> &
  RTFFormSpecificProps<SchemaType, FormType>;

export type TsForm<
  Mapping extends FormComponentMapping,
  PropsMapType extends PropsMapping,
  FormType extends FormComponent
> = <SchemaType extends z.ZodObject>(
  props: RTFFormProps<Mapping, SchemaType, PropsMapType, FormType>
) => React.ReactElement<any, any>;

export type TsFormCreateOptions<
  FormType extends FormComponent,
  PropsMapType extends PropsMapping
> = {
  /**
   * The component to wrap your fields in. By default, it is a `<form/>`.
   * @example
   * ```tsx
   * function MyCustomFormContainer({children, onSubmit}:{children: ReactNode, onSubmit: ()=>void}) {
   *  return (
   *    <form onSubmit={onSubmit}>
   *      {children}
   *      <button>Submit</button>
   *    </form>
   *  )
   * }
   * const MyForm = createTsForm(mapping, {
   *  FormComponent: MyCustomFormContainer
   * })
   * ```
   */
  FormComponent?: FormType;
  /**
   * Modify which props the form control and such get passed to when rendering components. This can make it easier to integrate existing
   * components with `@ts-react/form` or modify its behavior. The values of the object are the names of the props to forward the corresponding
   * data to.
   * @default
   * {
   *  name: "name",
   *  control: "control",
   *  enumValues: "enumValues",
   * }
   * @example
   * ```tsx
   * function MyTextField({someControlProp}:{someControlProp: Control<any>}) {
   *  //...
   * }
   *
   * const createTsForm(mapping, {
   *  propsMap: {
   *    control: "someControlProp"
   *  }
   * })
   * ```
   */
  propsMap?: PropsMapType;
};

export function createTsForm<
  Mapping extends FormComponentMapping,
  PropsMapType extends PropsMapping = typeof defaultPropsMap,
  FormType extends FormComponent = "form"
>(
  /**
   * An array mapping zod schemas to components.
   * @example
   * ```tsx
   * const mapping = [
   *  [z.string(), TextField] as const
   *  [z.boolean(), CheckBoxField] as const
   * ] as const
   *
   * const MyForm = createTsForm(mapping);
   * ```
   */
  componentMap: Mapping,
  /**
   * Options to customize your form.
   */
  options?: TsFormCreateOptions<FormType, PropsMapType>
): TsForm<Mapping, PropsMapType, FormType> {
  return createTsFormAndFragment<Mapping, PropsMapType, FormType>(
    componentMap,
    options
  )[0];
}

/**
 * Creates a reusable, typesafe form component based on a zod-component mapping.
 * @example
 * ```tsx
 * const mapping = [
 *  [z.string, TextField] as const
 * ] as const
 * const MyForm = createTsForm(mapping)
 * ```
 * @param componentMap A zod-component mapping. An array of 2-tuples where the first element is a zod schema and the second element is a React Functional Component.
 * @param options Optional - A custom form component to use as the container for the input fields.
 */
export function createTsFormAndFragment<
  Mapping extends FormComponentMapping,
  PropsMapType extends PropsMapping = typeof defaultPropsMap,
  FormType extends FormComponent = "form"
>(
  /**
   * An array mapping zod schemas to components.
   * @example
   * ```tsx
   * const mapping = [
   *  [z.string(), TextField] as const
   *  [z.boolean(), CheckBoxField] as const
   * ] as const
   *
   * const MyForm = createTsForm(mapping);
   * ```
   */
  componentMap: Mapping,
  /**
   * Options to customize your form.
   */
  options?: TsFormCreateOptions<FormType, PropsMapType>
) {
  const schemas = componentMap.map((e) => e[0]);
  checkForDuplicateTypes(schemas);
  checkForDuplicateUniqueFields(schemas);
  const propsMap = propsMapToObect(options?.propsMap ?? defaultPropsMap);
  const FormComponent = options?.FormComponent || "form";

  function TsForm<SchemaType extends z.ZodObject>({
    schema,
    onSubmit,
    props,
    formProps,
    defaultValues,
    renderAfter,
    renderBefore,
    form,
    children,
  }: RTFFormProps<Mapping, SchemaType, PropsMapType, FormType>) {
    const useFormResultInitialValue = useRef(form);
    if (!!useFormResultInitialValue.current !== !!form) {
      throw new Error(useFormResultValueChangedErrorMesssage());
    }
    const resolver = zodResolver(schema);

    const _form = form
      ? form
      : useForm({
          resolver,
        });

    useEffect(() => {
      if (_form && defaultValues) {
        _form.reset(defaultValues);
      }
    }, [_form]);

    const { handleSubmit, setError } = _form;
    const submitter = useSubmitter({
      resolver,
      onSubmit,
      setError,
    });
    const submitFn = handleSubmit(submitter.submit);

    return (
      <FormProvider {..._form}>
        <SubmitterContextProvider {...submitter}>
          <FormComponent {...formProps} onSubmit={submitFn}>
            {renderAfter?.({ submit: submitFn })}
            <FormFragment
              {...({
                schema,
                props,
                children,
              } as any)}
            />
            {renderBefore?.({ submit: submitFn })}
          </FormComponent>
        </SubmitterContextProvider>
      </FormProvider>
    );
  }

  type RenderFieldProps<Type extends z.ZodObject> = {
    schema: Type;
    props: PropType<Mapping, Type, PropsMapType>;
    // when a number schemaKey is assumed to be an array index
    schemaKey: string | number;
    form: UseFormReturn<Record<string, any>, any>;
    namePrefix: string | undefined;
    submitter: Submitter;
  };

  function renderField<Type extends z.ZodObject>({
    schema,
    props,
    schemaKey,
    form: { control, getValues },
    namePrefix,
    submitter,
  }: RenderFieldProps<Type>): RenderedElement {
    function renderComponentForSchemaDeep<NestedSchemaType extends z.ZodType>(
      type: NestedSchemaType,
      props: PropType<Mapping, NestedSchemaType, PropsMapType> | undefined,
      prefixedKey: string,
      currentValue: any
    ): RenderedElement {
      const Component = getComponentForZodType(type, componentMap);
      if (!Component) {
        if (type instanceof z.ZodObject) {
          const shape: Record<string, z.ZodObject> = type.shape;
          return Object.entries(shape).reduce((accum, [subKey, subType]) => {
            accum[subKey] = renderComponentForSchemaDeep(
              subType,
              props && props[subKey] ? (props[subKey] as any) : undefined,
              `${prefixedKey}.${subKey}`,
              currentValue && currentValue[subKey]
            );
            return accum;
          }, {} as RenderedObjectElements);
        }
        if (type instanceof z.ZodArray) {
          return ((currentValue as Array<any> | undefined | null) ?? []).map(
            (item, index) => {
              return renderComponentForSchemaDeep(
                type._zod.def.element as any,
                props,
                `${prefixedKey}[${index}]`,
                item
              );
            }
          );
        }
        throw new Error(
          noMatchingSchemaErrorMessage(
            prefixedKey.toString(),
            type._zod.def.type
          )
        );
      }
      const meta = getMetaInformationForZodType(type);

      const { beforeElement, afterElement } = (props ?? {}) as ExtraProps;

      const mergedProps = {
        ...(propsMap.name && { [propsMap.name]: prefixedKey }),
        ...(propsMap.control && { [propsMap.control]: control }),
        ...(propsMap.enumValues && {
          [propsMap.enumValues]: meta.enumValues,
        }),
        ...(propsMap.descriptionLabel && {
          [propsMap.descriptionLabel]: meta.description?.label,
        }),
        ...(propsMap.descriptionPlaceholder && {
          [propsMap.descriptionPlaceholder]: meta.description?.placeholder,
        }),
        ...props,
      };
      const ctxLabel = meta.description?.label;
      const ctxPlaceholder = meta.description?.placeholder;

      return (
        <Fragment key={prefixedKey}>
          {beforeElement}
          <FieldContextProvider
            control={control}
            name={prefixedKey}
            label={ctxLabel}
            zodType={type}
            placeholder={ctxPlaceholder}
            enumValues={meta.enumValues as string[] | undefined}
            addToCoerceUndefined={submitter.addToCoerceUndefined}
            removeFromCoerceUndefined={submitter.removeFromCoerceUndefined}
          >
            <Component key={prefixedKey} {...mergedProps} />
          </FieldContextProvider>
          {afterElement}
        </Fragment>
      );
    }
    const name = [namePrefix, stringifySchemaKey(schemaKey)]
      .filter(Boolean)
      .join(typeof schemaKey === "number" ? "" : ".");
    return renderComponentForSchemaDeep(
      schema,
      props as any,
      name,
      getValues()[name]
    );
  }

  function FormFragmentField<Type extends z.ZodObject>(
    props: Pick<RenderFieldProps<Type>, "schema" | "schemaKey"> &
      RequireKeysWithRequiredChildren<{
        props?: PropType<Mapping, Type, PropsMapType>;
      }>
  ) {
    return (
      <>
        {flattenRenderedElements(
          renderField({
            ...props,
            // TS can't understand that props will be required  when necessary because of the generic
            props: props.props!,
            form: useFormContext(),
            namePrefix: useMaybeFieldName(),
            submitter: useSubmitterContext(),
          })
        )}
      </>
    );
  }

  function FormFragment<SchemaType extends z.ZodObject>({
    schema,
    props,
    children,
    schemaKey,
  }: RTFSharedFormProps<Mapping, SchemaType, PropsMapType> & {
    // when a number schemaKey is assumed to be an array index
    schemaKey?: string | number;
  }) {
    const form = useFormContext<Record<string, any>>();

    const namePrefix = useMaybeFieldName();
    const submitter = useSubmitterContext();

    function renderFields(
      schema: SchemaType,
      props: PropType<Mapping, SchemaType, PropsMapType> | undefined
    ) {
      type SchemaKey = keyof SchemaType["shape"];
      const shape: Record<string, z.ZodObject> = schema.shape;
      return Object.entries(shape).reduce(
        (accum, [key, subSchema]: [SchemaKey, z.ZodObject]) => {
          // we know this is a string but TS thinks it can be number and symbol so just in case stringify
          const stringKey = key.toString();
          const fieldProps = props && props[key] ? props[key] : undefined;
          accum[stringKey] = renderField({
            form,
            schema: subSchema,
            props: fieldProps as any,
            namePrefix,
            submitter,
            schemaKey: [stringifySchemaKey(schemaKey), stringKey]
              .filter(Boolean)
              .join("."),
          });
          return accum;
        },
        {} as RenderedObjectElements
      ) as RenderedFieldMap<SchemaType>;
    }

    const renderedFields = renderFields(schema, props);
    return (
      <>
        <FormChildren
          renderedFields={renderedFields}
          customChildRenderProp={children}
        />
      </>
    );
  }

  function stringifySchemaKey(schemaKey: string | number | undefined) {
    return typeof schemaKey == "number" ? `[${schemaKey}]` : schemaKey;
  }

  // these needs to at least have one component wrapping it or the context won't propogate
  // i believe that means any hooks used in the CustomChildRenderProp are really tied to the lifecycle of this Children component... 😬
  // i ~think~ that's ok
  function FormChildren<SchemaType extends RTFFormSchemaType>({
    customChildRenderProp,
    renderedFields,
  }: {
    renderedFields: RenderedFieldMap<SchemaType>;
    customChildRenderProp?: CustomChildRenderProp<SchemaType>;
  }) {
    return (
      <>
        {customChildRenderProp
          ? customChildRenderProp(renderedFields)
          : flattenRenderedElements(renderedFields)}
      </>
    );
  }

  return [TsForm, FormFragment, FormFragmentField] as const;
}

// handles internal custom submit logic
// Implements a workaround to allow devs to set form values to undefined (as it breaks react hook form)
// For example https://github.com/react-hook-form/react-hook-form/discussions/2797
function useSubmitter<SchemaType extends z.ZodObject>({
  resolver,
  onSubmit,
  setError,
}: {
  resolver: Resolver<z.input<SchemaType>, unknown, z.output<SchemaType>>;
  onSubmit: RTFFormSubmitFn<z.infer<SchemaType>>;
  setError: UseFormSetError<z.input<SchemaType>>;
}): {
  submit: SubmitHandler<any>;
  removeUndefined: (data: any) => any;
  removeFromCoerceUndefined: (fieldName: string) => void;
  addToCoerceUndefined: (fieldName: string) => void;
} {
  const coerceUndefinedFieldsRef = useRef<Set<string>>(new Set());

  function addToCoerceUndefined(fieldName: string) {
    coerceUndefinedFieldsRef.current.add(fieldName);
  }

  function removeFromCoerceUndefined(fieldName: string) {
    coerceUndefinedFieldsRef.current.delete(fieldName);
  }

  function removeUndefined(data: any) {
    const r = { ...data };
    for (const undefinedField of coerceUndefinedFieldsRef.current) {
      delete r[undefinedField];
    }
    return r;
  }

  async function submit(data: z.infer<SchemaType>) {
    const e = await (resolver(
      removeUndefined(data) as any,
      {},
      {} as any
    ) as Promise<ResolverResult<z.infer<SchemaType>, any>>);
    const errorKeys = Object.keys(e.errors);
    if (!errorKeys.length) {
      await onSubmit(e.values);
      return;
    }
    for (const key of errorKeys) {
      setError(key as any, (e.errors as any)[key] as unknown as ErrorOption);
    }
  }

  return {
    submit,
    removeUndefined,
    removeFromCoerceUndefined,
    addToCoerceUndefined,
  };
}
type Submitter = ReturnType<typeof useSubmitter>;

const SubmitterContext = createContext<Submitter | null>(null);

export function useSubmitterContext() {
  const context = useContext(SubmitterContext);
  if (!context)
    throw new Error(
      "useSubmitterContext must be used within a SubmitterContextProvider"
    );
  return context;
}

export function SubmitterContextProvider({
  children,
  ...submitter
}: ReturnType<typeof useSubmitter> & { children: ReactNode }) {
  return <SubmitterContext.Provider value={submitter} children={children} />;
}

export type RenderedElement =
  | JSX.Element
  | JSX.Element[]
  | RenderedObjectElements
  | RenderedElement[];
export type RenderedObjectElements = { [key: string]: RenderedElement };

/***
 * Can be useful in CustomChildRenderProp to flatten the rendered field map at a given leve
 */
export function flattenRenderedElements(val: RenderedElement): JSX.Element[] {
  return Array.isArray(val)
    ? val.flatMap((obj) => flattenRenderedElements(obj))
    : typeof val === "object" && val !== null && !React.isValidElement(val)
    ? Object.values(val).reduce((accum: JSX.Element[], val) => {
        return accum.concat(flattenRenderedElements(val as any));
      }, [] as JSX.Element[])
    : [val];
}
