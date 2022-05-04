import "reflect-metadata"
import {container, inject, singleton} from "tsyringe";
import {computed, makeAutoObservable, makeObservable, observable} from "mobx";
import MobxReactForm from "mobx-react-form";
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
import json5 from "json5";
import {filterDir} from "../../utils/switcherUtils";
import * as electron from "electron";
import {IdeManager} from "@/renderer/core/IdeManager";
import {MRF} from "../../utils/MRF";
import remote from "@electron/remote";
import {ConEmuManager} from "@/renderer/core/ConEmuManager";
import {HostsManager} from "@/renderer/core/HostsManager";

export let useAppStore = () => {
    return container.resolve(AppStore);
};

@singleton()
export class AppStore {
    @observable
    registeredFolders: { path }[] = [
        // {path: 'C:\\Users\\biel\\projects'},
        // {path: 'C:\\Users\\biel\\projects\\sandbox'},
        // {path: 'C:\\Users\\biel\\projects\\git'}
    ];
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
    settings = {
        wsStartupExtraTime: 4000,
        wsProjectOpenTime: 5500,
        wsCommandName: 'webstorm',
        conEmuPath: "C:\\Program Files\\ConEmu\\ConEmu64.exe",
        conEmuFlags: "-Single"
    }

    settingsForm: MRF

    contextMenuStore: ContextMenuStore = new ContextMenuStore();


    ideManager: IdeManager = new IdeManager(this);
    conEmuManager: ConEmuManager = new ConEmuManager(this);
    hostsManager: HostsManager = new HostsManager(this)

    constructor() {
        makeObservable(this)

        this.init()
    }

    async init() {
        this.store = new Store({
            // serialize: v => json5.stringify(v, null, 2),
            // deserialize: s => json5.parse(s)
        });
        await this.contextMenuStore.init()
        // this.itemsSel = new C3Selection({
        //
        // })

        this.settingsForm = new MobxReactForm({
            fields: [
                'wsStartupExtraTime',
                'wsProjectOpenTime',
                'wsCommandName',
                'conEmuPath',
                'conEmuFlags',
            ],
        })

        await this.loadLocalData()
        this.ideManager.init()
        window['store'] = this
    }

    store: Store

    // itemsSel: C3Selection

    getSettingsDir() {
// return this.store.path
    }
    async loadLocalData() {
        let projectsArr = this.store.get('projects', []) as any[];
        this.projects = projectsArr.map(p => {
            return this.getProjectController(p.id, p)
        })
        Object.assign(this.settings, this.store.get('settings', this.settings) as any);
        this.settingsForm.update(this.settings)
        this.registeredFolders = this.store.get('registeredFolders', []) as any[]
    }

    async saveLocalData() {
        this.store.set('projects', this.projects.map(p => p.data))
        this.store.set('settings', this.settings)
        this.store.set('registeredFolders', this.registeredFolders)
    }

    projectControllerMap = {}

    getProjectController(projectId, initialData?: any, forceOverwrite = true): ProjectController {
        if (!_.isString(projectId)) throw new Error(`projectId is not a string`)
        if (!projectId) throw new Error(`Tried to access ${projectId} project id`)
        let cached = (this.projectControllerMap)[projectId];
        if (initialData && cached && forceOverwrite) cached.data = initialData
        if (cached) return cached;
        let newController = new ProjectController(projectId, initialData);
        newController.appStore = this
        return (this.projectControllerMap)[projectId] = newController
    }

    @computed
    get selectedProjects() {
        return this.projects.filter(project => project.data.checked)
    }

    @computed
    get selectedSubpaths() {
        return this.selectedProjects.flatMap(project => {
            return project.data.paths.filter(path => path.checked).map(p => {
                return {
                    project: project,
                    path: p,
                    fullPath: path.join(project.data.rootPath, p.path)
                }
            })
        })
    }

    selectProjectOnly(projectId) {
        this.projects.forEach(p => p.data.checked = p.data.id === projectId)
    }

    @computed
    get pathsToOpen() {
        let subpaths = this.selectedSubpaths.map(p => p.fullPath);
        return subpaths
    }


    @observable.ref
    scanResults = []
    @observable
    filter = ''

    scanRegistredFolders() {
        let directories = this.registeredFolders
        // get all first level subdirectories
        let subdirectories = directories.flatMap(d => d.path).map(p => {

            let subdirs = fs.readdirSync(p).filter(filterDir(p))
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
        let existing = this.projects.find(p => p.data.rootPath === path)
        if (!existing) this.projects.unshift(ProjectController.loadFromPath(path))
    }


    openConfigFile() {
        let configFile = require('path').resolve(this.store.path, '..')
        if (fs.existsSync(configFile)) {
            PowerShell.$`explorer "${configFile}"`
        }
    }

    /**
     * Open dev tools in electron from renderer process
     */
    openDevTools() {

    }

    removeRegisteredFolder(folder: { path }) {
        let index = this.registeredFolders.findIndex(f => f.path === folder.path)
        if (index > -1) this.registeredFolders.splice(index, 1)
        this.saveLocalData()
    }

    addRegisteredFolder() {
        let remote = require('@electron/remote');
        let r = remote.dialog.showOpenDialogSync(remote.getCurrentWindow(), {
            properties: ["openDirectory", "showHiddenFiles"]
        })
        if (!r || r.length == 0) return
        r.forEach((s) => this.registeredFolders.push({path: s}))
        this.saveLocalData()
    }
}
