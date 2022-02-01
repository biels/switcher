import {AppStore} from "@/renderer/core/AppStore";
import {makeObservable} from "mobx";
import {PowerShell} from "node-powershell";

export class ConEmuManager {
    appStore: AppStore;

    constructor(appStore: AppStore) {
        this.appStore = appStore;
        // makeObservable(this);
    }

    async openConEmuForPath(path){
        if(!this.appStore.settings.conEmuPath) return
        await PowerShell.invoke(`& "${this.appStore.settings.conEmuPath}" ${this.appStore.settings.conEmuFlags} -Dir "${path}"`)
    }
}
