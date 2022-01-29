import {AppStore, useAppStore} from "@/renderer/core/AppStore";
// import fs
import * as fs from "fs";
// import path
import * as path from "path";
import cuid from "cuid";

export interface ProjectPathData {
    id
    path
    open: string[]
    checked: boolean
}

export interface ProjectData {
    id
    name
    rootPath
    paths: ProjectPathData[]
}

export class ProjectController {
    id
    data: ProjectData

    constructor(projectId, initialData: any) {
        this.id = projectId
        this.data = initialData
    }


    appStore: AppStore

    static loadFromPath(path) {
        let configFile = path.join(path, "project.json")
        let data: ProjectData;
        if (!fs.existsSync(configFile)) {
            data = {
                id: cuid(),
                name: path.basename(path),
                rootPath: path,
                paths: []
            }
        } else {
            data = JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
        return useAppStore().getProjectController(data.id, data)
    }

    rediscoverPaths(){
        let paths = this.data.paths.map(p => p.path)
        let newPaths = fs.readdirSync(this.data.rootPath).filter(p => fs.statSync(path.join(this.data.rootPath, p)).isDirectory()).map(p => path.join(this.data.rootPath, p))
        let newPathsData = newPaths.map(p => ({
            id: cuid(),
            path: p,
            open: [],
            checked: true
        }))
        this.data.paths = [...newPathsData, ...this.data.paths.filter(p => paths.indexOf(p.path) === -1)]
        this.saveInProjectPath()
    }

    refresh(){
        this.rediscoverPaths()
    }

    /**
     * Save in the project path
     */
    saveInProjectPath() {
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

}
