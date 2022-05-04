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

export const HostsView = observer((props: SettingsViewProps) => {
    let store = useAppStore()

    let as = useAS((field, e) => {
        let fieldName = field.name;
        let value = form.$(fieldName).value;
        if (['wsStartupExtraTime', 'wsProjectOpenTime'].includes(fieldName)) value = Number(value)
        store.settings[fieldName] = value
        store.saveLocalData()
    }, 500)

    let form = store.settingsForm
    if (!form) return null;

    let hostsManager = store.hostsManager;
    let mode = hostsManager.mode

    return <Container>
        {/*<button onClick={() => {*/}
        {/*    hostsManager.mode == 'lan' ? hostsManager.mode = 'wan' : hostsManager.mode = 'lan';*/}
        {/*}}>*/}
        {/*    {hostsManager.mode == 'lan' ? 'Enable LAN Mode' : 'Enable WAN Mode'}*/}
        {/*</button>*/}
        <div>{hostsManager.mode == 'lan' ? 'LAN Mode (Enabled)' : 'WAN Mode (Disabled)'}</div>

        <div style={{display: 'grid', gridAutoFlow: 'column'}}>
            <button style={{padding: 8}} onClick={() => {
                hostsManager.editHostsFile(true)
                hostsManager.mode = 'lan'
            }}>Set LAN (Enable)
            </button>

            <button onClick={() => {
                hostsManager.editHostsFile(false)
                hostsManager.mode = 'wan'
            }}>Set WAN (Disable)
            </button>
        </div>

        <div>Patch:</div>
        <textarea value={hostsManager.getHostsPatchFileContent()}></textarea>
        <div style={{display: 'grid', gridAutoFlow: 'column'}}>
            <button onClick={() => openPathInExplorer(hostsManager.getHostsPatchFilePath())}>Open patch file</button>
            <button onClick={() => {
                hostsManager.openToolsDir()
            }}>Open Tools Dir
            </button>
        </div>
        Hosts content:
        <pre>{hostsManager.readHostsFile()}</pre>
        <button onClick={() => openPathInExplorer(hostsManager.getHostsFilePath())}>Open hosts file</button>
    </Container>
})
