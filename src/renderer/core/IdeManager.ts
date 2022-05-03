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
        } catch (e) {
            console.log(e)
        }
        if (openAfter) {
            await PowerShell.invoke(`${this.appStore.settings.wsCommandName}`)
        }
    }

    @observable
    usedMem = 0

    @observable
    wsRunning = false

    async getWSUsedGB() {
        try {
            let r = await PowerShell.$`((Get-Process webstorm64).PM | Measure-Object -Sum).Sum / 1GB`
            let mem = Number(r.raw.replace(',', "."))
            // console.log(`mem`, mem);
            this.usedMem = mem
            this.wsRunning = true
            return mem
        } catch (e) {
            // console.log(e);
            this.usedMem = 0
            this.wsRunning = false
            return 0
        }
    }


    async startMonitoring() {
        let ms = 2200;
        await this.getWSUsedGB()
        if (window['monitInterval']) clearInterval(window['monitInterval'])
        window['monitInterval'] = setInterval(() => {
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
    openedCount = 0
    @observable
    openTotalCount = 0
    @observable
    statusText = ''
    @observable
    openingSubpath = ''

    private cancelFlag: boolean = false;

    async openWSPath(p) {
        await PowerShell.invoke(`${this.appStore.settings.wsCommandName} "${p}"`)
    }

    async openWS(paths, closeOpen = true) {
        try {
            // let r = await Promise.all(paths.map(p => PowerShell.$`ws ${p}`))
            // let r = PowerShell.$`ws ${paths.map(p => `"${p}"`).join(' ')}`
            // console.log(`r`, r);
            let settings = this.appStore.settings;
            let delay = settings.wsProjectOpenTime;
            this.elapsedMs = 0
            let msInc = 50;
            let openDelay = settings.wsProjectOpenTime + settings.wsStartupExtraTime
            this.totalMs = delay * paths.length
            let interval = setInterval(() => {
                this.elapsedMs += msInc
            }, msInc)
            this.openTotalCount = paths.length
            let resetProcess = () => {
                clearInterval(interval)
                this.elapsedMs = 0
                this.totalMs = 0
                this.openedCount = 0
                this.statusText = ''
                this.openingSubpath = ''
            }
            let initialI = 0;
            if (closeOpen && (await this.getWSUsedGB()) > 1) {
                await this.stopWS(false);
            }
            await this.getWSUsedGB()
            if (!this.wsRunning) {
                let subpath = paths[0];
                let r = this.openWSPath(subpath)
                this.totalMs += openDelay
                this.openingSubpath = subpath
                this.openedCount++;
                await this.nextTimeout(openDelay)
                initialI++;
            }


            for (let i = initialI; i < paths.length; i++) {
                if (this.checkCanceled()) {
                    resetProcess()
                    return
                }
                let p = paths[i]
                let r = this.openWSPath(p)
                this.openingSubpath = p
                this.openedCount++;
                // console.log(`r`, r);
                await this.nextTimeout(delay)
            }
            this.elapsedMs = this.totalMs
            this.openTotalCount = 0
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
        return this.wsRunning
    }

    @computed
    get canStartWorkspace() {
        return !this.wsRunning
    }

    @computed
    get canRestartWorkspace() {
        return this.canStopWorkspace && this.canStartWorkspace
    }

    async startWorkspace() {
        await this.openWS(this.appStore.pathsToOpen, true)
    }

    stopWorkspace(openAfter = false) {
        console.log(`openAfter`, openAfter);
        this.stopWS(openAfter)
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
