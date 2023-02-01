import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {MdCopyAll, MdKeyboardReturn, MdOpenInNew, MdPlayArrow} from "react-icons/md";
import {openPathInExplorer} from "../../utils/switcherUtils";
import {useAppStore} from "@/renderer/core/AppStore";
import * as electron from "electron";
import {nextTimeout} from "../../utils/utils";

const Container = styled.div`
  display: grid;
  padding: 12px;
`
const ListContainer = styled.div`
  display: grid;
  gap: 12px
`
const NameContainer = styled.div`
  display: grid;
  font-weight: bold;
  font-size: 16px;

`
const PathContainer = styled.div`
  display: grid;
  font-size: 13px;
  padding-left: 8px;
`
const ActionsContainer = styled.div`
  display: grid;
  justify-content: start;
  padding-left: 8px;
  grid-auto-flow: column;
  gap: 4px
`

export interface WorkspaceViewProps {

}

export const WorkspaceView = observer((props: WorkspaceViewProps) => {
    let store = useAppStore()
    return <Container>
        <h3>Selected paths to open <button onClick={async (e) => {
            for (let i = 0; i < store.selectedSubpaths.length; i++){
                const it = store.selectedSubpaths[i];
                let command = it.path.startCmd;
                if (e.shiftKey) command = ''
                if (e.ctrlKey) command = (command || '').split(' ')[0]
                await store.conEmuManager.openConEmuForPath(it.fullPath, command);
                await nextTimeout(1000)
            }
        }}>Open all terminals</button></h3>
        <ListContainer>
            {store.selectedSubpaths.map((it, index) => {
                let openWebstorm = () => store.ideManager.openWS([it.fullPath], false);
                let copyPathToClipboard = () => electron.clipboard.writeText(`${it.fullPath}`);
                let listName = "sc" + it.fullPath;
                return <div style={{paddingLeft: 8}} key={index}
                                                          onContextMenuCapture={(e) => {
                                store.contextMenuStore.menuOptions = [
                                    {
                                        name: `Open`,
                                        icon: <MdPlayArrow/>,
                                        onClick: openWebstorm
                                    }, {
                                        name: `Open in explorer`,
                                        icon: <MdOpenInNew/>,
                                        onClick: () => openPathInExplorer(it.fullPath)
                                    }, {
                                        name: `Copy path`,
                                        icon: <MdCopyAll/>,
                                        onClick: copyPathToClipboard
                                    },
                                ]
                            }}
                >
                    <NameContainer>
                        {it.project.displayName(it.path.path)}
                    </NameContainer>
                    <PathContainer>
                        {it.fullPath}
                    </PathContainer>
                    <ActionsContainer>
                        <button onClick={(e) => {
                            let command = it.path.startCmd;
                            if (e.shiftKey) command = ''
                            if (e.ctrlKey) command = (command || '').split(' ')[0]
                            return store.conEmuManager.openConEmuForPath(it.fullPath, command);
                        }}>Open terminal
                        </button>
                        <input value={it.path.startCmd} onChange={e => {
                            it.path.startCmd = e.target.value;
                            store.saveLocalData();
                        }} list={listName}
                               onContextMenu={(e) => {
                                   let scripts = it.project.getPackageJsonScripts(it.path.path);
                                   if(!scripts) return;
                                   store.contextMenuStore.menuOptions = Object.entries(scripts).map(([k, v]) => {
                                       let ellipsisLength = 30;
                                       return {
                                           name: `${k} (${(v as string).substring(0, ellipsisLength)}${(v as string).length > ellipsisLength ? '...' : ''})`,
                                           icon: <MdKeyboardReturn/>,
                                           onClick: () => {
                                               it.path.startCmd = `yarn ${k}`;
                                           }
                                       }
                                   })
                                   store.contextMenuStore.menuOptions.unshift({
                                       name: `Open package.json`,
                                       icon: <MdPlayArrow/>,
                                       onClick: () => {
                                           openPathInExplorer(it.project.getPathPackageJsonPath(it.path.path))
                                       }
                                   })
                               }}
                        />
                        <datalist id={listName}>
                            {/*{Object.entries(it.project.getPackageJsonScripts(it.path.path) || {}).map(([k, v]) => {*/}
                            {/*    return <option key={k} value={`yarn ${k}`}>{v}</option>*/}
                            {/*})}*/}
                            {it.project.getCommands(it.path.path).map(({k, v, cmd}) => {
                                return <option key={k} value={cmd}>{v}</option>
                            })}
                        </datalist>
                        <button onClick={() => it.project.setCommandToDefault(it.path.path)}>Auto</button>
                    </ActionsContainer>
                </div>
            })}
        </ListContainer>
        <br/>
        {/*<pre>{json5.stringify(store.pathsToOpen, null, 2)}</pre>*/}

        {/*<div>*/}
        {/*    <div>Copy path here</div>*/}
        {/*    <input/>*/}
        {/*    <button onClick={() => store.ideManager.openWS([], false)}>Open in webstorm</button>*/}
        {/*</div>*/}
    </Container>
})
