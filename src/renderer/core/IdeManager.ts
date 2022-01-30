import {AppStore} from "@/renderer/core/AppStore";
import {PowerShell} from "node-powershell";
import {computed, makeObservable, observable} from "mobx";
import path from "path";

export class IdeManager {
    appStore: AppStore;

    constructor(appStore: AppStore) {
        this.appStore = appStore;
        makeObservable(this);
    }

    init() {
        this.startMonitoring()
    }

    async stopWS(openAfter = true) {
        try {
            await PowerShell.$`Stop-Process -Name "webstorm64"`
            if (openAfter) await PowerShell.$`ws`
        } catch (e) {
            console.log(e)
        }
    }

    @observable
    usedMem = 0

    async getWSUsedGB() {
        try {
            let r = await PowerShell.$`(Get-Process webstorm64).PM / 1GB`
            let mem = Number(r.raw)
            // console.log(`mem`, mem);
            this.usedMem = mem
            return mem
        } catch (e) {
            console.log(e);
            this.usedMem = 0
            return 0
        }
    }


    async startMonitoring() {
        let ms = 2200;
        if (!window['monitInterval']) window['monitInterval'] = setInterval(() => {
            this.getWSUsedGB()
        }, ms)
    }

    async stopMonitoring() {
        clearInterval(window['monitInterval'])
    }


    @observable
    elapsedMs = 0
    @observable
    totalMs = 0
    @observable
    statusText = ''
    private cancelFlag: boolean = false;

    async openWS(paths = [
        `C:\\Users\\biel\\projects\\switcher`,
        `C:\\Users\\biel\\projects\\bis\\bis-admin`,
        `C:\\Users\\biel\\projects\\bis\\bis-server`,
        `C:\\Users\\biel\\projects\\protocol\\pl-client`,
        `C:\\Users\\biel\\projects\\protocol\\pl-server`,
    ], closeOpen = true) {

        console.log(`paths`, paths);
        try {
            // let r = await Promise.all(paths.map(p => PowerShell.$`ws ${p}`))
            // let r = PowerShell.$`ws ${paths.map(p => `"${p}"`).join(' ')}`
            // console.log(`r`, r);
            let delay = 5000;
            this.elapsedMs = 0
            let msInc = 50;
            let openDelay = 6900
            this.totalMs = delay * paths.length
            let interval = setInterval(() => {
                this.elapsedMs += msInc
            }, msInc)
            let resetProcess = () => {
                clearInterval(interval)
                this.elapsedMs = 0
                this.totalMs = 0
                this.statusText = ''
            }
            if (closeOpen && (await this.getWSUsedGB()) > 1) {
                this.totalMs += openDelay
                await this.stopWS(false);
                await PowerShell.$`ws ${paths[0]}`
            }
            await this.nextTimeout(openDelay)

            for (let i = 0; i < paths.length; i++) {
                if (this.checkCanceled()) {
                    resetProcess()
                    return
                }
                let p = paths[i]
                let r = await PowerShell.$`ws ${p}`
                console.log(`r`, r);
                await this.nextTimeout(delay)
            }
            this.elapsedMs = this.totalMs
            resetProcess()
        } catch (e) {
            console.log(`e`, e);
        }
    }

    async nextTimeout(delay: number) {
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    @computed
    get canStopWorkspace() {
        return this.usedMem > 1
    }

    @computed
    get canStartWorkspace() {
        return this.usedMem < 1
    }

    @computed
    get canRestartWorkspace() {
        return this.canStopWorkspace && this.canStartWorkspace
    }

    async startWorkspace() {
        await this.openWS(this.appStore.pathsToOpen, false)
    }

    stopWorkspace() {
        this.stopWS(false)
    }

    cancelProcess(kill = false) {
        this.cancelFlag = true
        if (kill) {
            this.stopWS(false)
        }
    }

    checkCanceled() {
        if (this.cancelFlag) {
            this.cancelFlag = false
            return true
        }
        return false
    }
}
