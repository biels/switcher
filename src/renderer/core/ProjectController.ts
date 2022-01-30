import {AppStore, useAppStore} from "@/renderer/core/AppStore";
// import fs
import * as fs from "fs";
// import path
let path = require("path");
import cuid from "cuid";
import {makeObservable, observable} from "mobx";
import {filterDir} from "../../utils/switcherUtils";

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
        if (process.platform === "darwin") {
            require("child_process").exec(`open ${path}`)
        } else if (process.platform === "win32") {
            require("child_process").exec(`start ${path}`)
        } else {
            require("child_process").exec(`xdg-open ${path}`)
        }
    }
}
