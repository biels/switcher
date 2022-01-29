import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {MdDeleteOutline, MdOutlineSelectAll, MdPlayArrow} from "react-icons/md";
import {useAppStore} from "@/renderer/core/AppStore";

const Container = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
  height: 42px;
`
const ButtonsContainer = styled.div`
  display: grid;
  
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

export interface ControlToolbarProps {

}

/**
 * Allows restarting, starting and stopping workspace
 */
export const ControlToolbar = observer((props: ControlToolbarProps) => {
    let store = useAppStore()
    return <Container>
        {store.totalMs > 0 ? <progress value={store.elapsedMs} max={store.totalMs}/> : <div/>}
        <ButtonsContainer>
            <ButtonContainer>
                <MdPlayArrow/>
            </ButtonContainer>
        </ButtonsContainer>
    </Container>
})
