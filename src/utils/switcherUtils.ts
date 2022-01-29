import fs from "fs";
import path from "path";
import {useAppStore} from "@/renderer/core/AppStore";

export let filterDir = p => f => {
    if (f.startsWith('.')) return false
    if (['node_modules', 'tmp', 'dist', 'out', 'dev-dist'].includes(f)) return false
    let joined = fs.statSync(path.join(p, f));
    if (useAppStore().registeredFolders.find(d => d.path === joined)) return false
    return joined.isDirectory();
};
