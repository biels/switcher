import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";
import json5 from "json5";
import {MdDelete, MdFolderOpen, MdOpenInNew, MdOutlineSelectAll, MdPlayArrow, MdRefresh} from "react-icons/md";
import {GrCheckboxSelected} from "react-icons/gr";
import {openFileInCode, openFileInNotepad, openPathInExplorer} from "../../utils/switcherUtils";
import * as electron from "electron";
import {bindWithAS, useAS} from "../../utils/utils";
import {PowerShell} from "node-powershell";
import {useNavigate} from "react-router-dom";

const Container = styled.div`
  display: grid;
  padding-left: 12px;
  padding-right: 12px;
`

export interface SettingsViewProps {

}

export const HostsView = observer((props: SettingsViewProps) => {
    let store = useAppStore()
    let navigate = useNavigate()

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

    let statusText = {
        'lan': {text: 'LAN Mode (Enabled)', color: '#55b955'},
        'wan': {text: 'WAN Mode (Disabled)', color: '#bd3030'},
        'indeterminate': {text: 'Mixed Mode', color: '#c4a408'}
    }
    let statusObj = statusText[hostsManager.mode];
    let consistent = hostsManager.desiredMode === hostsManager.mode;
    return <Container>
        <div style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6, alignItems: 'center', padding: 16}}>
            <div style={{backgroundColor: statusObj.color, width: 12, height: 12, borderRadius: 10}}/>
            {statusObj.text} {consistent ? '' : `(should be ${hostsManager.desiredMode == 'lan' ? 'enabled' : 'disabled'})`}
        </div>

        <div style={{display: 'grid', gridAutoFlow: 'column'}}>
            <button style={{padding: 8}} disabled={hostsManager.mode == 'lan'} onClick={async () => {
                await hostsManager.editHostsFile(true)
                navigate(`/hosts`)
            }}>Set LAN (Enable)
            </button>

            <button disabled={hostsManager.mode == 'wan'} onClick={async () => {
                await hostsManager.editHostsFile(false)
                navigate(`/hosts`)
            }}>Set WAN (Disable)
            </button>
        </div>
        <div>Public IP: {hostsManager.publicIp}</div>
        <div>Patch:</div>
        <textarea style={{height: 80}} value={hostsManager.getHostsPatchFileContent()}></textarea>
        <div style={{display: 'grid', gridAutoFlow: 'column'}}>
            <button onClick={() => openFileInCode(hostsManager.getHostsJSONPatchFilePath())}>Open patch file</button>
            <button onClick={() => {
                hostsManager.openToolsDir()
            }}>Open Tools Dir
            </button>
            <button onClick={() => {
                hostsManager.resetPatchFile()
                navigate(`/hosts`)
            }}>Reset patch file
            </button>
            <button
              // disabled={consistent}
              onClick={() => {
                hostsManager.autoEnableDisable()
                navigate(`/hosts`)
            }}>Auto
            </button>
        </div>
        Hosts content:
        <pre>{hostsManager.readHostsFile()}</pre>
        <button onClick={() => openFileInNotepad(hostsManager.getHostsFilePath())}>Open hosts file</button>
        <div>Last updated: {hostsManager.hostsLastUpdatedAt && hostsManager.hostsLastUpdatedAt.toTimeString()}</div>
    </Container>
})
