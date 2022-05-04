import * as fs from "fs";
import * as path from "path";
import {PowerShell} from "node-powershell";
import {AppStore} from "@/renderer/core/AppStore";
import {makeObservable, observable} from "mobx";
import {app} from "@electron/remote";
import {openPathInExplorer} from "../../utils/switcherUtils";


export class HostsManager {
    appStore: AppStore;

    constructor(appStore: AppStore) {
        this.appStore = appStore;
        makeObservable(this);
        setTimeout(() => {
            // this.test1()
        })
    }

    @observable
    mode: 'lan' | 'wan' = "lan";

//
    readHostsFile() {
        let filePath = this.getHostsFilePath();
        let content = fs.readFileSync(filePath, {encoding: "utf-8"});
        console.log(`content`, content);
        return content;
    }

    openSettingsDir() {
        let dir = `${app.getPath('userData')}`
        openPathInExplorer(dir)
    }

    getHostsFilePath() {
        return `C:\\Windows\\System32\\Drivers\\etc\\hosts`
        // return `${app.getPath('appData')}\\hosts.test.txt`
    }
    getToolsDir(){
        return `${app.getPath('home')}\\tools`
    }
    getHostsPatchFilePath() {
        return `${this.getToolsDir()}\\hosts.template.txt`
    }

    getHostsPatchFileContent() {
        // if not exists, create it
        if (!fs.existsSync(this.getHostsPatchFilePath())) {
            let defaultContent = this.getDefaultPatchContent();
            fs.writeFileSync(this.getHostsPatchFilePath(), defaultContent, {encoding: "utf-8"});
        }
        return fs.readFileSync(this.getHostsPatchFilePath(), {encoding: "utf-8"});
    }

    private getDefaultPatchContent() {
        return "# Test template";
    }

    editHostsFile(apply = true) {
        // Edit hosts file according to the mode
        let content = this.readHostsFile()
        let newContent = this.mergeHostsFile(content, this.getHostsPatchFileContent(), !apply)
        fs.writeFileSync(this.getHostsFilePath(), newContent, {encoding: "utf-8"});
    }

    mergeHostsFile(exisitngHosts, patchHosts, subtract = false) {
        let add = !subtract;
        let parseHosts = (hosts) => {
            return hosts.trim().split('\n').map((line: string) => {
                line = line.trim();
                if (line.startsWith('#') || line.length == 0) return {comment: line};
                // parse using regex
                let [ip, host] = line.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(.*)$/).slice(1);
                return {ip, host};
            })
        }
        let serializeLine = (line) => {
            if (line.comment) {
                return line.comment
            } else if(line.ip && line.host) {
                return `${line.ip} ${line.host}`
            } else {
                return ''
            }
        };
        let eq = (l1, l2) => {
            return serializeLine(l1) == serializeLine(l2)
        }
        let existingParsed = parseHosts(exisitngHosts)
        let patchParsed = parseHosts(patchHosts)
        let result = []
        let missingLines = patchParsed;

        let linesMap = {}
        existingParsed.forEach((line, i) => {
            // find the same line in patch
            let patchLine = patchParsed.find((patchLine) => {
                return eq(patchLine, line)
                // return patchLine.ip === line.ip && patchLine.host === line.host
            })
            // console.log(`patchLine`, i, line, patchLine);
            if (add) {
                // Add
                // Remove from missing if found
                // if (patchLine) missingLines.filter(ml => !(eq(ml, patchLine)))
                let s = serializeLine(line);
                if(!patchLine){
                    result.push(line)
                    linesMap[s] = true
                }
            } else {
                // Subtract
                if (!patchLine) result.push(line)

            }
        })
        if (add) {
            result.push(...missingLines.filter(ml => !linesMap[serializeLine(ml)]))
        }

        let resultStr = result.map(serializeLine)

        return resultStr.join('\n')
    }

    test1() {
        let existing = `
            # Top comment in existing
            127.0.0.1 65.52.240.48
            127.0.0.1 69.167.144.18
            127.0.0.1 157.56.8.159
            127.0.0.1 69.167.144.15
            127.0.0.1 updater.techsmith.com
            127.0.0.1 camtasiatudi.techsmith.com
            127.0.0.1 tsccloud.cloudapp.net
            127.0.0.1 assets.cloud.techsmith.com
            # Comment here in existing
            127.0.0.1 other.host
            127.0.0.1  s3.protocolapp.net
            127.0.0.1 bis.protocolapp.net
            127.0.0.1 bis-dev.protocolapp.net
        `
        let patch = `
            # START PATCH Comment associated to patch
            # H1
            127.0.0.1 ci.protocolapp.net
            # H2
            127.0.0.1 protocolapp.net
            # H3
            127.0.0.1 s3.protocolapp.net
            # H4
            127.0.0.1 bis.protocolapp.net
            # H5
            127.0.0.1 bis-dev.protocolapp.net
            # END PATCH Comment in end of patch
        `
        let add = this.mergeHostsFile(existing, patch, false)
        console.log(`add`, '\n', add);
        let addTwice = this.mergeHostsFile(add, patch, false)
        console.log(`addTwice`, '\n', addTwice, add === addTwice ? 'PASS' : 'FAIL');
        let subtract = this.mergeHostsFile(existing, patch, true)
        console.log(`subtract`, '\n', subtract);
        let subtractAfterAdd = this.mergeHostsFile(add, patch, true)
        console.log(`subtractAfterAdd`, '\n', subtractAfterAdd);
        let addAgain = this.mergeHostsFile(subtractAfterAdd, patch, false)
        console.log(`add`, '\n', addAgain);
        console.log(`addAgain`, '\n', add, 'addAgain', addAgain, add == addAgain ? 'PASS' : 'FAIL');
        let subtractEmpty = this.mergeHostsFile(subtractAfterAdd, '', true)
        console.log(`subtractEmpty`, '\n', subtractEmpty, subtractEmpty === subtractAfterAdd ? 'PASS' : 'FAIL');
        // console.log(`add, addAgain`, add, '\n','\n', addAgain);
    }
}
