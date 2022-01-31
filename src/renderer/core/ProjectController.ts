import {AppStore, useAppStore} from "@/renderer/core/AppStore";
// import fs
import * as fs from "fs";
// import path
let path = require("path");
import cuid from "cuid";
import {computed, makeObservable, observable, runInAction} from "mobx";
import {filterDir, openPathInExplorer} from "../../utils/switcherUtils";

export interface ProjectPathData {
    id?
    path
    open: string[]
    checked: boolean
}

export interface ProjectData {
    id?
    name
    rootPath
    checked: boolean;
    paths: ProjectPathData[]
}

export class ProjectController {
    id
    @observable
    data: ProjectData
    @observable
    localData: ProjectData

    constructor(projectId, initialData: any) {
        this.id = projectId
        this.data = initialData
        makeObservable(this)
    }


    appStore: AppStore

    static loadFromPath(p) {
        let configFile = path.join(p, "project.json")
        let data: ProjectData;
        if (!fs.existsSync(configFile)) {
            data = {
                id: cuid(),
                name: path.basename(p),
                rootPath: p,
                checked: true,
                paths: []
            }
        } else {
            data = JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
        let controller = useAppStore().getProjectController(data.id, data);
        // controller.loadLocalData();
        controller.rediscoverPaths()
        controller.saveInProjectPath()
        return controller
    }

    rediscoverPaths() {
        try {
            let paths = this.data.paths.map(p => p.path)
            let newPaths = fs.readdirSync(this.data.rootPath)
                .filter(filterDir(this.data.rootPath))
                .map(p => path.join(this.data.rootPath, p))
            let newPathsData = newPaths.map(p => ({
                id: cuid(),
                path: path.relative(this.data.rootPath, p),
                open: [],
                checked: true
            }))
            newPathsData.push({
                id: cuid(),
                path: '.',
                open: [],
                checked: newPathsData.length == 0
            })
            this.data.paths = [...newPathsData, ...this.data.paths.filter(p => paths.indexOf(p.path) === -1)]
            // this.saveInProjectPath()
        } catch (e) {
            console.log(`e`, e);
        }
    }

    refresh() {
        this.rediscoverPaths()
    }

    /**
     * Save in the project path
     */
    saveInProjectPath() {
        let rootPathExists = fs.existsSync(this.data.rootPath)
        if (!rootPathExists) {
            // fs.mkdirSync(this.data.rootPath)
            return
        }
        let configFile = path.join(this.data.rootPath, "project.json")
        // check if the project json file exists
        if (fs.existsSync(configFile)) {
            // if it exists, update it
            fs.writeFileSync(configFile, JSON.stringify(this.data, null, 4))
        } else {
            // if it doesn't exist, create it
            fs.writeFileSync(configFile, JSON.stringify(this.data, null, 4))
        }
    }


    delete() {
        this.appStore.projects.splice(this.appStore.projects.indexOf(this), 1)
        delete this.appStore.projectControllerMap[this.id]
        this.appStore.saveLocalData()

    }

    openInExplorer() {
        let path = this.data.rootPath
        openPathInExplorer(path)
    }

    select(subpaths: string[] | null, value: boolean | null = true) {
        console.log(`subpaths`, subpaths);
        this.data.paths.forEach(p => {
            if (!subpaths || subpaths.includes(p.path)) {
                if (value === null) {
                    p.checked = !p.checked
                } else {
                    p.checked = value
                }
            }
        })
        this.saveInProjectPath()
        this.appStore.saveLocalData()

    }

    selectAll(value: boolean | null = true) {
        this.select(null, value)
    }

    setChecked(value: boolean | null = true) {
        this.data.checked = value
        this.saveInProjectPath()
        this.appStore.saveLocalData()
    }

    @computed
    get selectedSubpaths() {
        return this.data.paths.filter(path => path.checked)
    }

    async start(closeOpen = false) {
        await this.appStore.ideManager.openWS(this.selectedSubpaths.map(p => p.path), closeOpen)
    }
}
