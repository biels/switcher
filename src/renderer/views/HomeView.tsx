import React from 'react'
import {useAppStore} from "@/renderer/core/AppStore";
import {observer} from "mobx-react";
import styled from 'styled-components'
import {ProjectsList} from "@/renderer/views/components/ProjectsList/ProjectsList";
import {ControlToolbar} from "@/renderer/views/components/ControlToolbar";

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
`
const HomeView = observer(() => {
    let store = useAppStore()
    let counter = store.counter
    return (
        <Container>
            <ControlToolbar/>
            <ProjectsList/>
            <div>
                <button onClick={() => store.ideManager.openWS([`C:\\Users\\biel\\projects\\switcher`])}>Open switcher</button>
                <button onClick={() => store.ideManager.openWS([`C:\\Users\\biel\\projects\\switcher`], false)}>Open switcher no
                    close
                </button>
                <button onClick={() => store.ideManager.openWS()}>Open all</button>
                <button onClick={() => store.ideManager.stopWS(false)}>Close WS</button>
                <div>


                </div>
                <div>
                    <button onClick={() => store.ideManager.getWSUsedGB()}>Get used memory</button>
                    <div>{store.ideManager.usedMem.toFixed(2)} GB</div>
                </div>
            </div>
        </Container>
    );
});
export default HomeView
