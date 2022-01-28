import "reflect-metadata"
import {container, inject, singleton} from "tsyringe";
import {makeAutoObservable, makeObservable, observable} from "mobx";
import {PowerShell} from 'node-powershell';
import cuid from "cuid";

export let useAppStore = () => {
    return container.resolve(AppStore);
};

@singleton()
export class AppStore {
    @observable
    projects: any[] = [
        {
            id: cuid(),
            name: 'Switcher',
            rootPath: 'C:\\Users\\biel\\projects\\switcher',
            paths: [
                {
                    id: cuid(),
                    path: './switcher',
                    open: ['terminal', 'ide'],
                    cmd: 'yarn start'
                }
            ]
        },  {
            id: cuid(),
            name: 'BIS',
            rootPath: 'C:\\Users\\biel\\projects\\bis',
            paths: [
                {
                    id: cuid(),
                    path: './bis-admin',
                    open: ['terminal', 'ide'],
                    cmd: 'yarn dev'
                }, {
                    id: cuid(),
                    path: './bis-server',
                    open: ['terminal', 'ide'],
                    cmd: 'yarn start:dev'
                }
            ]
        },
    ]
    @observable
    counter = 0

    constructor() {
        makeAutoObservable(this)
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
            console.log(`mem`, mem);
            this.usedMem = mem
            return mem
        } catch (e) {
            console.log(e);
            this.usedMem = 0
            return 0
        }
    }

    monitInterval = null

    async startMonitoring() {
        let ms = 2200;
        if (!this.monitInterval) this.monitInterval = setInterval(() => {
            this.getWSUsedGB()
        }, ms)
    }

    async stopMonitoring() {
        clearInterval(this.monitInterval)
    }


    @observable
    elapsedMs = 0
    @observable
    totalMs = 0

    async openWS(paths = [
        `C:\\Users\\biel\\projects\\switcher`,
        `C:\\Users\\biel\\projects\\bis\\bis-admin`,
        `C:\\Users\\biel\\projects\\bis\\bis-server`,
        `C:\\Users\\biel\\projects\\protocol\\pl-client`,
        `C:\\Users\\biel\\projects\\protocol\\pl-server`,
    ], closeOpen = true) {


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
            if (closeOpen && (await this.getWSUsedGB()) > 1) {
                this.totalMs += openDelay
                await this.stopWS(false);
                await PowerShell.$`ws ${paths[0]}`
            }
            await this.nextTimeout(openDelay)

            for (let i = 0; i < paths.length; i++) {
                let p = paths[i]
                let r = await PowerShell.$`ws ${p}`
                console.log(`r`, r);
                await this.nextTimeout(delay)
            }
            this.elapsedMs = this.totalMs
            this.totalMs = 0
            clearInterval(interval)
        } catch (e) {
            console.log(`e`, e);
        }
    }

    async nextTimeout(delay: number) {
        await new Promise(resolve => setTimeout(resolve, delay))
    }


}
