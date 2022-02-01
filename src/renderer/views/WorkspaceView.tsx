import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {MdCopyAll, MdOpenInNew, MdPlayArrow} from "react-icons/md";
import {openPathInExplorer} from "../../utils/switcherUtils";
import {useAppStore} from "@/renderer/core/AppStore";
import * as electron from "electron";

const Container = styled.div`
  display: grid;

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

`

export interface WorkspaceViewProps {

}

export const WorkspaceView = observer((props: WorkspaceViewProps) => {
    let store = useAppStore()
    return <Container>
        <h3>Selected paths to open</h3>
        <ListContainer>
            {store.selectedSubpaths.map((it, index) => {
                let openWebstorm = () => store.ideManager.openWS([it.fullPath], false);
                let copyPathToClipboard = () => electron.clipboard.writeText(`${it.fullPath}`);
                return <div style={{paddingLeft: 8}} key={index}
                            onContextMenu={(e) => {
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
                        <button onClick={() => store.conEmuManager.openConEmuForPath(it.fullPath)}>Open terminal</button>
                    </ActionsContainer>
                </div>
            })}
        </ListContainer>
        <br/>
        {/*<pre>{json5.stringify(store.pathsToOpen, null, 2)}</pre>*/}

        <div>
            <div>Copy path here</div>
            <input/>
            <button onClick={() => store.ideManager.openWS([], false)}>Open in webstorm</button>
        </div>
    </Container>
})
