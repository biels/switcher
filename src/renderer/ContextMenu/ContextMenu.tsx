import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {ContextMenuStore, MenuOption} from "./ContextMenuStore";

const Container = styled.div`

  position: fixed;
  background: white;
  box-shadow: 0px 2px 10px #999999;
  z-index: 100;
 

  &--separator {
    width: 100%;
    height: 1px;
    background: #CCCCCC;
    margin: 0 0 0 0;
  }
`

const OptionContainer = styled.div`
  display: grid;
  grid-template-columns: 16px auto 1fr auto;
  padding: 6px 10px 5px 8px;
  min-width: 160px;
  cursor: default;
  font-size: 12px;
  align-items: center;
  grid-gap: 6px;

  :hover {
    background: #2cd5f1;
    //color: white;
  }

  > .active {
    color: #e9e9e9;
    background: linear-gradient(to top, #555, #444);
  }

  > .disabled {
    color: #999999;
    pointer-events: none;
  }
`
const IconContainer = styled.div`
  display: grid;
  place-content: center;
`

const HotKeyContainer = styled.div`
  color: #555
`

export interface ContextMenuProps {
    store: ContextMenuStore
}

export const ContextMenu = observer((props: ContextMenuProps) => {
    let store = props.store
    useEffect(() => {
        document.addEventListener('contextmenu', store._handleContextMenu);
        document.addEventListener('click', store._handleClick);
        document.addEventListener('scroll', store._handleScroll);
        return () => {
            document.removeEventListener('contextmenu', store._handleContextMenu);
            document.removeEventListener('click', store._handleClick);
            document.removeEventListener('scroll', store._handleScroll);
        }
    }, [])
    return store.visible && <Container ref={props.store.rootRef} className="contextMenu">
        {store.menuOptions.map((o, i) => {
            return <OptionContainer key={i} className={`option`} onClick={() => o.onClick()}>
                <IconContainer>{o.icon || ''}</IconContainer>
                <div>{o.name}</div>
                <div/>
                <HotKeyContainer>{o.hotKey || ''}</HotKeyContainer>
            </OptionContainer>
        })}
    </Container>
})
