import * as fs from "fs";
import {PowerShell} from "node-powershell";
import {AppStore} from "@/renderer/core/AppStore";
import {makeObservable, observable} from "mobx";
import {app} from "@electron/remote";
import {openPathInExplorer} from "../../utils/switcherUtils";
import * as _ from 'lodash'
import {domains, genHosts} from "../../utils/hosts/hosts-gen";
import json5 from "json5";

export class HostsManager {
    appStore: AppStore;

    constructor(appStore: AppStore) {
        this.appStore = appStore;
        makeObservable(this);
        setTimeout(async () => {
            // this.test1()
            if (process.platform != 'win32') return
            this.refreshMode();
            await this.autoEnableDisable()
        })
    }

    @observable
    mode: 'lan' | 'wan' | 'indeterminate' = "lan";
    @observable
    desiredMode: 'lan' | 'wan' | null = null;

    @observable
    hostsLastUpdatedAt: Date = null;

    @observable
    loading = {
        settingMode: null
    }


//
    readHostsFile() {
        if (process.platform != 'win32') return ''
        let filePath = this.getHostsFilePath();
        let content = fs.readFileSync(filePath, {encoding: "utf-8"});
        return content;
    }

    async writeHostsFile(newContent) {
        if (process.platform != 'win32') return
        if (!_.isString(newContent)) return
        if (newContent.length == 0) return
        // newContent = 'hi'
        let tmpFilePath = `${this.getToolsDir()}\\hosts.tmp.txt`
        let testFilePath = `${this.getToolsDir()}\\hosts.test.txt`
        fs.writeFileSync(tmpFilePath, newContent, {encoding: "utf-8"});
        // $var = "ls"; Start-Process powershell -Verb runAs -Argument "-Command $var"
        // let command = `Start-Process powershell -Verb runAs -Command Set-Content -Path "${this.getHostsFilePath()}" -Value @"\n${newContent}\n"@`;
        // let innerCommand = `Set-Content -Path "${this.getHostsFilePath()}" -Value @"\n${newContent}\n"@\n Start-Sleep -s 15`;
        let hostsFilePath = this.getHostsFilePath();
        let innerCommand = `Copy-Item -Path "${tmpFilePath}" -Destination "${hostsFilePath}" -Force`;
        let command = `$var = '${innerCommand}'; Start-Process powershell -Verb runAs -Argument "-Command $var"`;
        console.log(`command`, command);
        try {
            let r = await PowerShell.invoke(command)
            console.log(`PS result`, r);
            if (!r.hadErrors) {
                this.hostsLastUpdatedAt = new Date();
            }
        } catch (e) {
            console.error(`e`, e);
        }
    }

    openSettingsDir() {
        let dir = `${app.getPath('userData')}`
        openPathInExplorer(dir)
    }

    openToolsDir() {
        openPathInExplorer(this.getToolsDir())
    }

    getHostsFilePath() {
        return `C:\\Windows\\System32\\Drivers\\etc\\hosts`
        // return `${app.getPath('appData')}\\hosts.test.txt`
    }

    getToolsDir() {
        return `${app.getPath('home')}\\tools`
    }


    getHostsPatchFilePath() {
        return `${this.getToolsDir()}\\hosts.template.txt`
    }

    getHostsPatchFileContent() {
        // if not exists, create it
        let jsonContent = this.getHostsJSONPatchFileContent();
        let content = json5.parse(jsonContent);
        return genHosts(content);
        // if (!fs.existsSync(this.getHostsPatchFilePath())) {
        //     let defaultContent = content;
        //     fs.writeFileSync(this.getHostsPatchFilePath(), defaultContent, {encoding: "utf-8"});
        // }
        // return fs.readFileSync(this.getHostsPatchFilePath(), {encoding: "utf-8"});
    }

    getHostsJSONPatchFilePath() {
        return `${this.getToolsDir()}\\hosts.template.json5`
    }

    getHostsJSONPatchFileContent() {
        // if not exists, create it
        // checking write permissions
        if (!fs.existsSync(this.getHostsJSONPatchFilePath())) {
            let defaultContent = this.getDefaultJSONPatchContent();
            fs.writeFileSync(this.getHostsJSONPatchFilePath(), defaultContent, {encoding: "utf-8"});
        }

        return fs.readFileSync(this.getHostsJSONPatchFilePath(), {encoding: "utf-8"});
    }

    private getDefaultPatchContent() {
        return genHosts()
    }

    private getDefaultJSONPatchContent() {
        return json5.stringify(domains, null, 2);
    }

    async editHostsFile(apply = true) {
        if (process.platform != 'win32') return
        this.loading.settingMode = apply ? 'lan' : 'wan';
        // Edit hosts file according to the mode
        let content = this.readHostsFile()
        let newContent = this.mergeHostsFile(content, this.getHostsPatchFileContent(), !apply)
        // fs.writeFileSync(this.getHostsFilePath(), newContent, {encoding: "utf-8"});
        // console.log(`newContent`, newContent);
        await this.writeHostsFile(newContent)
        // setTimeout(() => this.refreshMode(), 100)
        let check = () => {
            if (this.loading.settingMode && this.refreshMode())
                this.loading.settingMode = null;
        };
        let ms = [100, 500, 700, 1000, 2000];
        ms.map(m => setTimeout(check, m))
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
            } else if (line.ip && line.host) {
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
                if (!patchLine) {
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

    checkHostsContainsPatch(): 'lan' | 'wan' | 'indeterminate' {
        let content = this.readHostsFile()
        let patch = this.getHostsPatchFileContent()
        let add = this.mergeHostsFile(content, patch, false)
        let subtract = this.mergeHostsFile(content, patch, true)

        if (content == add) {
            return 'lan'
        } else if (content == subtract) {
            return 'wan'
        } else {
            return 'indeterminate'
        }

    }

    refreshMode(): boolean {
        let newMode = this.checkHostsContainsPatch();
        let b = newMode != this.mode;
        this.mode = newMode
        return b
        // this.getCurrentPublicIp()
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

    resetPatchFile() {
        // Make backup of the patch file
        fs.copyFileSync(this.getHostsJSONPatchFilePath(), this.getHostsJSONPatchFilePath() + '.bak');
        fs.writeFileSync(this.getHostsJSONPatchFilePath(), this.getDefaultJSONPatchContent(), {encoding: "utf-8"});
    }

    publicIp: string = ''

    async getCurrentPublicIp() {
        // icanhazip.com
        let url = 'https://icanhazip.com/'
        let response = await fetch(url);
        let ip = await response.text();
        this.publicIp = ip
        return ip
    }

    async getDesiredMode() {
        let currentPublicIp = await this.getCurrentPublicIp();
        let content = json5.parse(this.getHostsJSONPatchFileContent())
        let targetIp = content._publicIp
        if (currentPublicIp.trim() === targetIp.trim()) {
            this.desiredMode = 'lan'
        } else {
            this.desiredMode = 'wan'
        }
        return this.desiredMode
    }

    async autoEnableDisable() {
        let desiredMode = await this.getDesiredMode()
        if (desiredMode === this.mode) {
            return
        }
        if (desiredMode === 'lan') {
            await this.editHostsFile(true)
        } else {
            await this.editHostsFile(false)
        }
    }


}
