import {makeObservable, observable} from "mobx";
import React from "react";
import {predicateAwareClassFactory} from "tsyringe";
import {nextTimeout} from "../../utils/utils";
import {AppStore, useAppStore} from "@/renderer/core/AppStore";

export interface MenuOption {
    name: string
    icon?
    hotKey?: string
    onClick?: Function
    subOptions?: MenuOption[]
    disabled?: boolean
}

export class ContextMenuStore {
    // appStore: AppStore

    @observable
    menuOptions: MenuOption[] = [{name: 'no options'}]

    async init() {
        // this.appStore = useAppStore()
    }

    constructor(
    ) {
        makeObservable(this)
    }

    @observable
    visible = false

    rootRef: React.RefObject<HTMLDivElement> = React.createRef()

    _handleContextMenu = async (event: MouseEvent) => {
        event.preventDefault();
        console.log(`setting visible true`);
        this.visible = true
        console.log(`set visible true`);
        // await nextTimeout(100)
        const clickX = event.clientX;
        const clickY = event.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        let root = this.rootRef.current;
        if(!root) {
            console.log(`no root`);
            return
            throw new Error('No root ref')
        }
        const rootW = root.offsetWidth;
        const rootH = root.offsetHeight;

        const right = (screenW - clickX) > rootW;
        const left = !right;
        const top = (screenH - clickY) > rootH;
        const bottom = !top;

        if (right) {
            root.style.left = `${clickX + 5}px`;
        }

        if (left) {
            root.style.left = `${clickX - rootW - 5}px`;
        }

        if (top) {
            root.style.top = `${clickY + 5}px`;
        }

        if (bottom) {
            root.style.top = `${clickY - rootH - 5}px`;
        }
    };

    closeMenu = () => {
        this.visible = false
        this.menuOptions = []
    }

    _handleClick = (event) => {
        let visible = this.visible
        const wasOutside = !(event.target.contains === this.rootRef.current);

        if (wasOutside && visible) this.closeMenu()
    };

    _handleScroll = () => {
        let visible = this.visible

        if (visible) this.closeMenu()
    };
}
