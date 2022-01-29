import "reflect-metadata"
import {container, inject, singleton} from "tsyringe";
import {computed, makeAutoObservable, makeObservable, observable} from "mobx";
import {PowerShell} from 'node-powershell';
import cuid from "cuid";
import {ContextMenuStore} from "@/renderer/ContextMenu/ContextMenuStore";
import * as _ from 'lodash'
// import fs
import * as fs from "fs";
// import path
import * as path from "path";
import {ProjectController} from "@/renderer/core/ProjectController";

import Store from "electron-store";

export let useAppStore = () => {
    return container.resolve(AppStore);
};

@singleton()
export class AppStore {
    registeredFolders: { path }[] = [
        {path: 'C:\\Users\\biel\\projects'},
        {path: 'C:\\Users\\biel\\projects\\sandbox'},
        {path: 'C:\\Users\\biel\\projects\\git'}
    ];
    projectPaths: string[] = [];
    @observable
    projects: ProjectController[] = []
    //     [
    //     {
    //         id: cuid(),
    //         name: 'Switcher',
    //         rootPath: 'C:\\Users\\biel\\projects\\switcher',
    //         paths: [
    //             {
    //                 id: cuid(),
    //                 path: './switcher',
    //                 open: ['terminal', 'ide'],
    //                 cmd: 'yarn start'
    //             }
    //         ]
    //     }, {
    //         id: cuid(),
    //         name: 'BIS',
    //         rootPath: 'C:\\Users\\biel\\projects\\bis',
    //         paths: [
    //             {
    //                 id: cuid(),
    //                 path: './bis-admin',
    //                 open: ['terminal', 'ide'],
    //                 cmd: 'yarn dev'
    //             }, {
    //                 id: cuid(),
    //                 path: './bis-server',
    //                 open: ['terminal', 'ide'],
    //                 cmd: 'yarn start:dev'
    //             }
    //         ]
    //     },
    // ]
    @observable
    counter = 0

    contextMenuStore: ContextMenuStore = new ContextMenuStore();
    private cancelFlag: boolean = false;

    constructor() {
        makeObservable(this)
        this.startMonitoring()
        this.init()
    }

    async init() {
        this.store = new Store();
        await this.contextMenuStore.init()
        // this.itemsSel = new C3Selection({
        //
        // })
       await this.loadLocalData()
    }

    store: Store
    // itemsSel: C3Selection

    async loadLocalData() {
        let projectsArr = this.store.get('projects', []) as any[];
        this.projects = projectsArr.map(p => {
            return this.getProjectController(p.id, p)
        })
        // this.registeredFolders = this.store.get('registeredFolders', []) as any[]
    }
    async saveLocalData() {
        this.store.set('projects', this.projects.map(p => p.data))
        this.store.set('registeredFolders', this.registeredFolders)
    }

    projectControllerMap = {}

    getProjectController(projectId, initialData?: any, forceOverwrite = true) {
        if (!_.isString(projectId)) throw new Error(`projectId is not a string`)
        if (!projectId) throw new Error(`Tried to access ${projectId} project id`)
        let cached = (this.projectControllerMap)[projectId];
        if (initialData && cached && forceOverwrite) cached.data = initialData
        if (cached) return cached;
        let newController = new ProjectController(projectId, initialData);
        newController.appStore = this
        return (this.projectControllerMap)[projectId] = newController
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
    @observable
    statusText = ''

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

    @observable.ref
    scanResults = []
    @observable
    filter = ''

    scanRegistredFolders() {
        let directories = this.registeredFolders
        // get all first level subdirectories
        let subdirectories = directories.flatMap(d => d.path).map(p => {
            let filterDir = p => f => {
                if (f.startsWith('.')) return false
                if (['node_modules', 'tmp', 'dist', 'out', 'dev-dist'].includes(f)) return false
                let joined = fs.statSync(path.join(p, f));
                if (this.registeredFolders.find(d => d.path === joined)) return false
                return joined.isDirectory();
            };
            let subdirs = fs.readdirSync(p).filter(filterDir(p))
            // return subdirs
            // return subdirs
            return subdirs.flatMap(s => {
                let path1 = path.join(p, s);
                let innerSubdirs = fs.readdirSync(path1).filter(filterDir(path1))
                return {
                    name: s,
                    path: path1,
                    folder: path.basename(p),
                    subdirs: innerSubdirs
                }
            })
            // return subdirs.map(s => path.join(p, s))
        }).flat()
        this.scanResults = subdirectories
        console.log(`this.scanResults`, this.scanResults);
    }

    importProject(path: string) {
        this.projects.push(ProjectController.loadFromPath(path))
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

    startWorkspace() {
        this.openWS()
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
