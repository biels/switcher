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
            {store.totalMs > 0 ? <progress value={store.elapsedMs} max={store.totalMs}/> : <div>
                3 selected
            </div>}
            <span>{store.statusText}</span>
        </ProgressContainer>
        <ButtonsContainer>
            <ButtonContainer onClick={() => store.startWorkspace()}>
                {store.canRestartWorkspace ? <MdPlayArrow/> : <MdRestartAlt/>}
            </ButtonContainer>
            <ButtonContainer onClick={() => store.stopWorkspace()}>
                <MdStop/>
            </ButtonContainer>
        </ButtonsContainer>
    </Container>
})
