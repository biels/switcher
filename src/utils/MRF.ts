export interface SubmitOptions {
    onSuccess: (fieldset) => any
    onError: (fieldset) => any
}

export type FieldComputedValue =
    'hasError'
    | 'isValid'
    | 'isDirty'
    | 'isPristine'
    | 'isDefault'
    | 'isEmpty'
    | 'focused'
    | 'touched'
    | 'changed'

export interface SharedActions {
    has(fieldName: string): boolean

    map(fn: (field: MRFField) => any)

    each(fn: (field: MRFField) => any)

    add(options?)

    del(options?)

    update(options)

    $(fieldName: string): MRFField

    select(fieldName: string, fields?: string[], isStrict?: boolean): MRFField

    check(computedValue: FieldComputedValue, nested?): Promise<boolean>

    focus()

    /**
     * This will get all fields prop (with nested fields as fields objects):
     * @param filterByProp or filtering by a prop (with nested fields as collections)
     */
    get(filterByProp?)

    /**
     * Set field value. Takes the value. Provide an object to set nested fields values.
     * @param value
     */
    set(value)

    /**
     * Set field property. Takes prop key and prop value.
     * @param prop Key to set
     * @param val Value or object to set
     */
    set(prop: string, val)

    /**
     * Provide Field key to check if exist.
     * @param key
     */
    has(key): boolean

    /**
     * Map Nested Fields
     * @param callback
     */
    map(callback: (field: MRFField, i) => any): any[]

    each(callback: (field: MRFField, i, depth) => any)

    /**
     * Add a Field or Nested Fields.
     * @param obj
     */
    add(obj)

    /**
     * Delete a Field or Nested Fields by key or path.
     * @param key
     */
    del(key)

    /**
     * Define a MobX Observer on Field Props or Field Map.
     * @param obj
     */
    observe(obj)

    /**
     * Define a MobX Interceptor on Field Props or Field Map.
     * @param obj
     */
    intercept(obj)

    /**
     * Check if the form has Nested Fields.
     */
    hasNestedFields(): boolean

    /**
     * Check if the nested fields have incremental keys.
     */
    hasIncrementalKeys(): boolean

    /**
     * Clear to empty values
     */
    clear()

    /**
     * Reset to default values
     */
    reset()

    // Helpers
    values()

    errors()

    labels()

    placeholders()

    defaults()

    initials()

    types()

    //Event handlers
    onSubmit(e)

    onClear(e)

    onReset(e)

    onAdd(e)

    onDel(e)

    submit(options?: SubmitOptions)

    validate(options?: { showErrors?: boolean })

    invalidate(errorMsg: string)

    showErrors(b: boolean)


    // Other
    key
    name
    value
}

export interface MRFField extends SharedActions {

    // Event handlers
    onChange: (value) => void
    onToggle: (value) => void
    onFocus: () => void
    onBlur: () => void
    onClear: (e) => void
    onReset: (e) => void

    [other: string]: any
}

export interface MRF extends SharedActions {

    constructor({fields}, {hooks}?)

    validate(fieldName);

    init(options)


    [other: string]: any

}
