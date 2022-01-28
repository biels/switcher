import {action, autorun, computed, observable, reaction} from "mobx";
import {EntityObject, ID, Ref} from "./interfaces";
import * as _ from 'lodash'
import {MRF, MRFField} from "./MRF";


export interface C3SelectionInitOptions {
    /**
     * Reference to items
     */
    items?: EntityObject[]
    itemsRef?: Ref<EntityObject[]>
    form?: MRF
    // formField?: MRFField
    formPath?: any[]
    updater?: (sel: C3Selection) => Function

    initialState?: C3SelectionOptions
    onSelectionChanged?: (selectedIds: any[], unSelectedIds: any[], isUser: boolean) => any
    onBeforeSelectionChanged?: () => any
    singleSelPolicy?: SingleSelPolicy
    incomplete?: boolean
    canItemBeSelected?: (item) => boolean
}

export interface C3SelectionOptions {
    id?: any | any[]
    index?: number | number[]
    where?: (item: any) => boolean
    limit?: number
    /** true| false | null (null means toggle) */
    select?: boolean | null
    overwrite?: boolean
    /** Replaces old selection and triggers events (ids) */
    newSelection?: any[] //
    /** Whether selection should trigger an update */
    update?: boolean
    isUser?: boolean
}

export type AutoSelectPolicy = true | 'first' | 'last' | 'middle' | 'random' | C3SelectionOptions;

export type SingleSelPolicy = 'first' | 'last' | 'none'

export class C3Selection {
    type = 'selection'

    @observable.shallow
    itemsRef: Ref<EntityObject[]>


    form: MRF

    formField: MRFField


    @observable
    selectedIds: ID[] = []

    incomplete = false
    singleSelPolicy: SingleSelPolicy = 'none'

    // @observable
    // focusedId: ID = null
    onSelectionChanged?: C3SelectionInitOptions['onSelectionChanged']
    onBeforeSelectionChanged?: C3SelectionInitOptions['onBeforeSelectionChanged']

    updater: Function
    formPathUpdater: Function
    currentPath: any[]
    @observable
    parentUnselected: boolean = false


    protected canItemBeSelected: (item) => boolean
    canItemBeSelectedMap: { [itemId: string]: boolean } = {}
    useSelectableCache = false

    constructor(options: C3SelectionInitOptions) {
        if (options.itemsRef) {
            this.setItemsRef(options.itemsRef)
        } else {
            this.itemsRef = {current: []}
        }
        if (options.items) this.setItems(options.items)
        if (options.form) this.form = options.form
        this.onSelectionChanged = options.onSelectionChanged ?? ((a1, a2) => null)
        this.onBeforeSelectionChanged = options.onBeforeSelectionChanged ?? (() => null)
        if (options.initialState) this.select(options.initialState)
        this.incomplete = options.incomplete
        if (options.updater) setTimeout(() => this.updater = options.updater(this))
        if (options.canItemBeSelected) this.canItemBeSelected = options.canItemBeSelected

        if (options.formPath) {
            // this.formField = this.form as any as MRFField;
            this.formPathUpdater = autorun((reaction) => {
                let path = options.formPath || []
                let unrolledPath = []
                for (let i = 0; i < path.length; i++) {
                    let pathElement = path[i];
                    if (pathElement?.type == 'selection') {
                        let selFieldKey = (pathElement as C3Selection)?.selField?.key;
                        if (selFieldKey == null) {
                            this.parentUnselected = true
                            return;
                        }
                        unrolledPath.push(selFieldKey)
                    } else {
                        unrolledPath.push(pathElement)
                    }
                }

                this.currentPath = unrolledPath

                // console.log(`unrolledPath`, unrolledPath);
                // console.log(`pathElement`, pathElement);
                let getFieldsAfterPath = () => {
                    let fields = [];
                    let field = this.form as any as MRFField
                    for (let i = 0; i < unrolledPath.length; i++) {
                        let pathElement = unrolledPath[i];
                        if (pathElement == null) {
                            console.log(`${pathElement} is null. So far:`, fields, unrolledPath);
                            return null;
                        }
                        pathElement = _.toString(pathElement)
                        if (field.has(pathElement)) {
                            field = field.$(pathElement)
                        } else {
                            console.log(`${field.name} does not have ${pathElement}`, fields);
                            return null;
                        }
                        fields.push(field)
                    }
                    return fields
                }
                let fieldsAfterPath = getFieldsAfterPath();
                if (fieldsAfterPath == null) {
                    console.error(`Path ${JSON.stringify(unrolledPath)} did not find a field. this.formField will be null`, this.form.values());
                    // debugger;
                }
                // debugger;
                // console.log(`Updating using path`, path, field);
                // console.log(`fields`, fieldsAfterPath);
                this.formField = fieldsAfterPath[fieldsAfterPath.length - 1]
                this.parentUnselected = false
            })
        }
        if (this.formFieldMode) this.useSelectableCache = false
        if (this.useSelectableCache) {
            reaction(() => {
                let a = this.canItemBeSelected;
                let b = this.itemsRef.current;
                return {a, b}
            }, (value, previousValue) => {
                this.canItemBeSelectedMap = {}
            }, {
                fireImmediately: false,
                name: 'canItemBeSelectedMap Clerarer',
                requiresObservable: true,

            })
        }
    }

    @computed
    get selectedId() {
        if (this.singleSelPolicy == "none" && this.selectedIds.length > 1) return null
        return _.last(this.selectedIds)
    }

    @computed
    get formFieldMode() {
        return this.formField != null
    }

    // Derived state
    @computed
    get items() {
        // console.log(`I1`, this.formFieldMode);
        if (this.parentUnselected) return []
        if (this.formFieldMode) {
            // return this.formField.value
            return this.formField.value?.filter(v => v != null)
        }
        return this.itemsRef.current
    }

    setItems(items: EntityObject[]) {
        if (this.formFieldMode) throw 'Not implemented'
        this.itemsRef.current = items
    }

    setItemsRef(itemsRef: Ref<EntityObject[]>) {
        if (this.formFieldMode) throw 'Not implemented'
        this.itemsRef = itemsRef
        // console.log(`itemsRef`, itemsRef);
    }

    @computed
    get areItemsValid() {
        return this.items && _.isArray(this.items)
    }

    @computed
    get selectedIndexes(): number[] {
        let selectedIndexes;
        if (this.selectedIds && this.areItemsValid)
            selectedIndexes = this.selectedIds
                .map(selId => _.findIndex(this.items as EntityObject[], it => it && it.id === selId));
        return selectedIndexes || []
    }

    @computed
    /**
     * Gets selected fields using selectedIds.
     * Values must have an id property to appear in the result.
     */
    get selFields(): MRFField[] {
        return this.getFieldsByIds(this.selectedIds)
    }

    getFieldById(id: ID): MRFField {
        return _.last(this.getFieldsByIds([id]))
    }

    getFieldsByIds(ids: ID[] = this.selectedIds) {
        let fields = []
        if (this.parentUnselected) return fields
        this.formField?.each((f, i, d) => {
            if (d > 0) return
            // console.log(`processing f`, f.path);
            if (f.has('id') && ids.includes(f.$('id').value))
                fields.push(f)
        })
        return fields
    }

    @computed
    get selField(): MRFField {
        if (this.singleSelPolicy == "none" && this.selectedIds.length > 1) return null
        return _.last(this.selFields)
    }

    @computed
    get selectedIndex(): number | null {
        return _.last(this.selectedIndexes)
    }


    @computed
    get selectedItems(): EntityObject[] {
        // TODO Implement get directly from grid when incomplete
        return this.selectedIndexes.map(selI => (this.items)[selI]).filter(it => it != null)
    }

    @computed
    get selectedItem(): EntityObject {
        return _.last(this.selectedItems)
    }

    private selectIncomplete(options: C3SelectionOptions) {
        let {id, index, limit, where, select, overwrite, update} = options;
        let toggle = select === null;
        let onSelectionChangedParams = [null, null]
        let targetedIds = id
        let currentSelectedIds = this.selectedIds
        let newSelectionIds;
        if (options.overwrite) {
            this.onBeforeSelectionChanged()
            this.selectedIds = targetedIds
            this.onSelectionChanged([], [], options.isUser)
            return
        } else {
            if (toggle) {
                // Impl. Toggle logic
                // console.log(`Selection toggle mode`);
                // Toggle selection of targetedItemsIds
                let unselectedItemsIds = _.difference(targetedIds, currentSelectedIds);
                onSelectionChangedParams = [[], unselectedItemsIds];
                newSelectionIds = unselectedItemsIds;
            } else if (options.select) {
                let newlySelectedItemsIds = _.difference(targetedIds, currentSelectedIds);
                // Emit selection.ts events
                onSelectionChangedParams = [newlySelectedItemsIds, []];
                newSelectionIds = _.concat(currentSelectedIds, newlySelectedItemsIds);
            } else {
                newSelectionIds = _.difference(currentSelectedIds, targetedIds);
                let newlyUnselectedItemsIds = _.difference(currentSelectedIds, targetedIds);
                onSelectionChangedParams = [[], newlyUnselectedItemsIds];
            }
        }
        this.onBeforeSelectionChanged()
        this.selectedIds = newSelectionIds
        this.onSelectionChanged(onSelectionChangedParams[0], onSelectionChangedParams[1], options.isUser)
        // console.log(`Finished selecting (incomplete sel)`, this.selectedIds, newSelectionIds);
    }

    @action
    select(options: C3SelectionOptions) {
        // console.log(`Selecting...`, options);
        if (options == null) return;
        if (this.incomplete) return this.selectIncomplete(options)
        if (!this.areItemsValid) return;
        let {id, index, limit, where, select, overwrite, update} = options;
        if (update !== false) update = true;
        let toggle = select === null;
        let targetedItems = [];
        let targetedIds = []
        if (select === undefined) select = true;
        if (id != null) {
            let ids: ID[]
            if (!_.isArray(id)) {
                if (overwrite == null) overwrite = true;
                ids = [id];
            } else {
                ids = id
            }
            //Ignore @dry selection
            // id = id.filter(id1 => id1 != '@dry')
            targetedItems = this.items.filter(it => ids.includes(it.id));
            targetedIds = ids
        } else if (index !== undefined) {
            if (!_.isArray(index)) {
                if (overwrite == null) overwrite = true;
                index = [index] as any;
            }
            targetedItems = (index as number[]).map(i => this.items[i]);

            // console.log(`Is index`, index, targetedItems, dataItems);
        } else if (_.isFunction(where)) {
            targetedItems = this.items.filter(where);
        } else if (where === undefined) {
            targetedItems = this.items as any;
        }

        // Filter
        // if (this.canItemBeSelected != null && options.isUser)
        //     targetedItems = targetedItems.filter(it => this.isSelectable(it))

        // console.log(`targetedItems`, targetedItems);
        // Add or subtract selection.ts
        let selectedItemsIds = overwrite ? [] : (this.selectedItems).map(it => it?.id);
        let targetedItemsIds = targetedItems.filter(it => it != null).map(it => it?.id);
        let newSelectionIds = targetedItemsIds;
        let onSelectionChangedParams = [null, null]
        if (!overwrite) { // By default overwrite is true
            if (toggle) {
                // Impl. Toggle logic
                // console.log(`Selection toggle mode`);
                // Toggle selection of targetedItemsIds
                let unselectedItemsIds = _.difference(targetedItemsIds, selectedItemsIds);
                onSelectionChangedParams = [selectedItemsIds, unselectedItemsIds];
                newSelectionIds = unselectedItemsIds;
            } else if (select) {
                let newlySelectedItemsIds = _.difference(targetedItemsIds, selectedItemsIds);
                // Emit selection.ts events
                onSelectionChangedParams = [newlySelectedItemsIds, []];
                newSelectionIds = _.concat(selectedItemsIds, newlySelectedItemsIds);
            } else {
                newSelectionIds = _.difference(selectedItemsIds, targetedItemsIds);
                let newlyUnselectedItemsIds = _.difference(selectedItemsIds, newSelectionIds);
                onSelectionChangedParams = [[], newlyUnselectedItemsIds];
            }
        } else {
            //Impl. Overwrite true (?)
            onSelectionChangedParams = [targetedItemsIds, this.selectedIds];
            // debugger;
            newSelectionIds = targetedItemsIds;
        }
        this.onBeforeSelectionChanged()
        this.selectedIds = newSelectionIds
        this.onSelectionChanged(onSelectionChangedParams[0], onSelectionChangedParams[1], options.isUser)
        // console.log(`Finished selecting`, this.selectedId, newSelectionIds);
    }


    // Derived selection methods
    @action
    selectItems(options: C3SelectionOptions) {
        this.select(options)
    }

    @action
    selectItem(options: C3SelectionOptions) {
        this.select(options)
    }

    @action
    selectId(id: any, select?: boolean, overwrite?: boolean, update?: boolean, isUser?: boolean) {
        this.select({id, select, overwrite, update, isUser})
    }

    @action
    selectIds(ids: any[], select?: boolean, overwrite?: boolean, update?: boolean, isUser?: boolean) {
        this.select({id: ids, select, overwrite, update, isUser})
    }

    @action
    selectIndex(index: number, select?: boolean, overwrite?: boolean, update?: boolean, isUser?: boolean) {
        this.select({index, select, overwrite, update, isUser})
    }

    @action
    selectIndexes(indexes: number[], select?: boolean, overwrite?: boolean, update?: boolean, isUser?: boolean) {
        this.select({index: indexes, select, overwrite, update, isUser})
    }

    @action
    selectWhere(where: (item: EntityObject) => boolean, select?: boolean, overwrite?: boolean, update?: boolean, isUser?: boolean) {
        this.select({where, select, overwrite, update, isUser})
    }

    @action
    onChange(newSelection?: any[], update?: boolean, isUser?: boolean) {
        this.select({id: newSelection, update, overwrite: true, isUser})
    }

    @action
    clearSelection() {
        this.onBeforeSelectionChanged()
        this.selectedIds = []
    }

    @action
    clearSelectionWhere(where: (item: EntityObject) => boolean = (it) => true, select: boolean = false, overwrite: boolean = true, update?: boolean) {
        this.select({
                where,
                select,
                overwrite,
                update,
            }
        )
    }


    @action
    autoSelect(policy: AutoSelectPolicy, update?: boolean) {
        this.select({})
    }

    //Other helpers

    @computed
    get allSelected() {
        if (this.selectedIds.length == 0) return false
        return this.selectedIds.length == this.items.length
    }

    @computed
    get selectedCount() {
        return this.selectedIds.length
    }

    @computed
    get itemsCount() {
        return this.items.length
    }

    @computed
    get countOfTotal() {
        return `${this.selectedCount}/${this.itemsCount}`
    }


    isSelected(id: any): boolean {
        return this.selectedIds.includes(id)
    }


    isSelectable(id: any): boolean {
        if (this.canItemBeSelected == null) return true
        if (!this.useSelectableCache) return this.canItemBeSelected(id)
        let cachedValue = this.canItemBeSelectedMap[id];
        if (cachedValue == null) {
            this.canItemBeSelected[id] = this.canItemBeSelected(id)
        }
        return cachedValue || this.canItemBeSelected[id]
    }

    onRefreshSelectable = () => null

    refreshItemMatrix() {
        this.onRefreshSelectable()
        // Deselect newly forbidden
    }


}
