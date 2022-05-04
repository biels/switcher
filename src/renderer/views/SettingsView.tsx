import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";
import json5 from "json5";
import {MdDelete, MdFolderOpen, MdOpenInNew, MdOutlineSelectAll, MdPlayArrow, MdRefresh} from "react-icons/md";
import {GrCheckboxSelected} from "react-icons/gr";
import {openPathInExplorer} from "../../utils/switcherUtils";
import * as electron from "electron";
import {bindWithAS, useAS} from "../../utils/utils";
import {PowerShell} from "node-powershell";

const Container = styled.div`
  display: grid;
  padding-left: 12px;
`

export interface SettingsViewProps {

}

export const SettingsView = observer((props: SettingsViewProps) => {
    let store = useAppStore()

    let as = useAS((field, e) => {
        console.log(`saving field`, field, e);
        let fieldName = field.name;
        console.log(`fieldName`, fieldName);
        let value = form.$(fieldName).value;
        if (['wsStartupExtraTime', 'wsProjectOpenTime'].includes(fieldName)) value = Number(value)
        console.log(`value`, value, fieldName);
        store.settings[fieldName] = value
        store.saveLocalData()
    }, 500)

    let form = store.settingsForm
    if (!form) return null;

    let $wsStartupExtraTime = form.$('wsStartupExtraTime')
    let $wsProjectOpenTime = form.$('wsProjectOpenTime')
    let $wsCommandName = form.$('wsCommandName')
    let $conEmuPath = form.$('conEmuPath')
    let $conEmuFlags = form.$('conEmuFlags')

    return <Container>

        <h3 onContextMenu={(e) => {
            store.contextMenuStore.menuOptions = [
                {
                    name: `Add path`,
                    icon: <MdFolderOpen/>,
                    onClick: () => {
                        return store.addRegisteredFolder();
                    }
                }

            ]

        }}>Registered Folders
        </h3>
        {store.registeredFolders.map(folder => <div onContextMenu={(e) => {
            store.contextMenuStore.menuOptions = [
                {
                    name: `Remove`,
                    icon: <MdFolderOpen/>,
                    onClick: () => store.removeRegisteredFolder(folder)
                },

            ]

        }}>{folder.path}</div>)}
        <div>
            <button onClick={() => store.addRegisteredFolder()}>Add folder</button>
        </div>
        {/*<pre>{json5.stringify(store.registeredFolders, null, 2)}</pre>*/}
        {/*<button onClick={() => store.scanRegistredFolders()}>Scan all projects</button>*/}
        <br/>

        <h3>Config file</h3>
        <div onClick={() => {
            store.openConfigFile()
        }}>{store.store.path}</div>
       <div> <button onClick={() => {
           store.openConfigFile()
       }}> Open config directory
       </button>
           <button onClick={() => store.saveLocalData()}>Save config locally</button></div>
        {/*<pre>{json5.stringify(store.scanResults, null, 2)}</pre>*/}

        <h3>Settings</h3>
        <div>
            <div>Startup extra time</div> <input placeholder={'Startup extra time'} {...bindWithAS($wsStartupExtraTime, as)}/>
            <div>Project open time</div> <input placeholder={'Project open time'} {...bindWithAS($wsProjectOpenTime, as)}/>
            <div>Command name</div> <input placeholder={'Command name'} {...bindWithAS($wsCommandName, as)}/>
            <div>ConEmu Path</div> <input placeholder={'ConEmu Path'} {...bindWithAS($conEmuPath, as)}/>
            <div>ConEmu Flags</div> <input placeholder={'ConEmu Flags'} {...bindWithAS($conEmuFlags, as)}/>
        </div>
        {/*<button onClick={() => store.store.openInEditor()}>Open in editor</button>*/}

        <div>
            <button onClick={async () => {
                let result = await PowerShell.invoke(`${store.settings.wsCommandName}`)
            }}>
                <MdPlayArrow/>
            </button>
        </div>
    </Container>
})
