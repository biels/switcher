import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {MdDeleteOutline, MdOutlineSelectAll, MdPlayArrow, MdRestartAlt, MdStop} from "react-icons/md";
import {useAppStore} from "@/renderer/core/AppStore";

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  height: 42px;
`
const ButtonsContainer = styled.div`
  display: grid;
  grid-auto-flow: column;

`
const ButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  justify-items: center;
  height: 100%;
  padding: 0 10px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }

`

const ProgressContainer = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns:auto 1fr;
  grid-gap: 10px;
  align-content: center;
  padding: 0 10px;
`

export interface ControlToolbarProps {

}

/**
 * Allows restarting, starting and stopping workspace
 */
export const ControlToolbar = observer((props: ControlToolbarProps) => {
    let store = useAppStore()
    return <Container>
        <ProgressContainer>
            {store.ideManager.totalMs > 0 ?
                <div>Opening {store.ideManager.openedCount + 1} / {store.ideManager.openTotalCount}</div> : <div>
                    {store.selectedSubpaths.length} selected / {store.selectedProjects.length} projects
                </div>}
            <span>{store.ideManager.statusText}</span>
        </ProgressContainer>
        <ButtonsContainer>
            <ButtonContainer onClick={() => store.ideManager.startWorkspace()}>
                {store.ideManager.canRestartWorkspace ? <MdPlayArrow/> : <MdRestartAlt/>}
            </ButtonContainer>
            <ButtonContainer onClick={(e) => store.ideManager.stopWorkspace(!e.shiftKey)}>
                <MdStop/>
            </ButtonContainer>
        </ButtonsContainer>
    </Container>
})
