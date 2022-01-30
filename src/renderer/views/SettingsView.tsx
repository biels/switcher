import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";
import json5 from "json5";

const Container = styled.div`
    display: grid;
    
`

export interface SettingsViewProps {

}

export const SettingsView = observer((props: SettingsViewProps) => {
    let store = useAppStore()
    return <Container>
        <div>Paths to open</div>
        <pre>{json5.stringify(store.pathsToOpen, null, 2)}</pre>
        <div>Registered Folders</div>
        <pre>{json5.stringify(store.registeredFolders, null, 2)}</pre>
        {/*{store.registeredFolders.map(folder => <div>{folder}</div>)}*/}
        <button onClick={() => store.scanRegistredFolders()}>Scan all projects</button>

        <div onClick={() => {
            store.openConfigFile()
        }}>{store.store.path}</div>
        <button onClick={() => {
            store.openConfigFile()
        }}> Open </button>
        <button onClick={() => store.saveLocalData()}>Save local</button>
        <pre>{json5.stringify(store.scanResults, null, 2)}</pre>
    </Container>
})
