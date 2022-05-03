import * as fs from "fs";
import * as path from "path";
import {PowerShell} from "node-powershell";
import {AppStore} from "@/renderer/core/AppStore";
import {makeObservable, observable} from "mobx";


export class HostsManager {
    appStore: AppStore;

    constructor(appStore: AppStore) {
        this.appStore = appStore;
        makeObservable(this);
    }

    @observable
    mode: 'lan' | 'wan' = "lan";

//
    readHostsFile() {
        let filePath = this.getHostsFilePath();
        let content = fs.readFileSync(filePath, { encoding: "utf-8" });
        console.log(`content`, content);
        return content;
    }

    getHostsFilePath() {
        return `C:\\Windows\\System32\\Drivers\\etc\\hosts`
    }
    editHostsFileExample() {
        let content = this.readHostsFile()
        let newContent = content.concat('\n# Added by Switcher')
        fs.writeFileSync(this.getHostsFilePath(), newContent, { encoding: "utf-8" });
    }
}
