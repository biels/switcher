import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";
import json5 from "json5";
import {MdDelete, MdFolderOpen, MdOpenInNew, MdOutlineSelectAll, MdPlayArrow, MdRefresh} from "react-icons/md";
import {GrCheckboxSelected} from "react-icons/gr";
import {openPathInExplorer} from "../../utils/switcherUtils";
import * as electron from "electron";

const Container = styled.div`
  display: grid;
  padding-left: 12px;
`

export interface SettingsViewProps {

}

export const SettingsView = observer((props: SettingsViewProps) => {
    let store = useAppStore()
    return <Container>
        <h3>Selected paths to open</h3>
        {store.pathsToOpen.map((path, index) => {
            return <div style={{paddingLeft: 0}} key={index}
                        onContextMenu={(e) => {
                            store.contextMenuStore.menuOptions = [
                                {
                                    name: `Open`,
                                    icon: <MdPlayArrow/>,
                                    onClick: () => store.ideManager.openWS([path], false)
                                }, {
                                    name: `Open in explorer`,
                                    icon: <MdOpenInNew/>,
                                    onClick: () => openPathInExplorer(path)
                                },

                            ]

                        }}
            >{path}</div>
        })}
        <br/>
        {/*<pre>{json5.stringify(store.pathsToOpen, null, 2)}</pre>*/}
        <h3 onContextMenu={(e) => {
            store.contextMenuStore.menuOptions = [
                {
                    name: `Add path`,
                    icon: <MdFolderOpen/>,
                    onClick: () => {
                        // open file dialog in electron

                        let remote = require('@electron/remote');
                        let r = remote.dialog.showOpenDialogSync(remote.getCurrentWindow(), {
                            properties: ["openDirectory", "showHiddenFiles"]
                        })
                        if (r.length == 0) return

                        return store.addRegisteredFolder(r[0]);
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
    </Container>
})
