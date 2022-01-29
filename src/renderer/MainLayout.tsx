import React, {Fragment} from 'react';
import {HashRouter, Link, Route, Routes} from 'react-router-dom';
import styled, {ThemeProvider} from 'styled-components';
import defaultTheme from '@/renderer/styles/defaultTheme';
import {GlobalStyle} from "@/renderer/styles/GlobalStyle";
import {ExampleView1} from '@/renderer/views/ExampleView1';
import {ExampleView2} from '@/renderer/views/ExampleView2';
import HomeView from '@/renderer/views/HomeView';
import {useAppStore} from "@/renderer/core/AppStore";
import {JSONView} from "@/renderer/views/JSONView";
import {SettingsView} from "@/renderer/views/SettingsView";
import {ContextMenu} from "@/renderer/ContextMenu/ContextMenu";
import {OpenProjectsView} from "@/renderer/views/OpenProjectsView";
import {observer} from "mobx-react";

const Content = styled.div`
  min-height: 100vh;
  overflow-x: hidden;
  display: grid;
  grid-template-areas: 
        "header  header"
        "panel   body"
        "footer footer";

  grid-template-areas: 
        "header  header"
        "body   body"
        "footer footer";
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr auto;
`;

const SidePanel = styled.div`
  grid-area: panel;
  padding: 16px;
  background-color: ${props => props.theme.colors.brand2.main};
  color: ${props => props.theme.colors.brand2.contrast};

  a {
    display: block;
    margin-top: 32px;
  }
`;

const Header = styled.div`
  grid-area: header;
  background-color: ${props => props.theme.colors.brand1.main};
  color: ${props => props.theme.colors.brand1.contrast};
  padding: 4px 12px;
  display: grid;
  grid-template-columns: auto auto auto 1fr auto;
  gap: 8px;
`;
const Body = styled.div`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.foreground};
  grid-area: body;
  max-height: calc(100vh - 51px);
  overflow-y: auto;
  //padding: 16px;
`;

const Footer = styled.div`
  grid-area: footer;
  padding: 2px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  background-color: ${props => props.theme.colors.brand1.main};
  color: ${props => props.theme.colors.brand1.contrast};
`;
const StatusContainer = styled.div`
  display: grid;
  grid-auto-flow: column;
`
const MemoryContainer = styled.div`
  display: grid;
  user-select: none;
  
`
const MainLayout = observer(() => {
    let store = useAppStore()

    return (
        <Fragment>
            <ThemeProvider theme={defaultTheme}>
                <GlobalStyle/>
                <HashRouter>
                    <Content>
                        {/*<SidePanel>*/}
                        {/*    /!*<Link to="/">Home</Link>*!/*/}
                        {/*    /!*<Link to="/example-view-1">Example 1</Link>*!/*/}
                        {/*    /!*<Link to="/example-view-2">Example 2</Link>*!/*/}
                        {/*</SidePanel>*/}
                        <Header>
                            <Link to="/">
                                <div>Switcher</div>
                            </Link>
                            <Link to="/json">
                                <div>JSON</div>
                            </Link>
                            <Link to="/open">
                                <div>Open</div>
                            </Link>
                            <div/>
                            <Link to="/settings">
                                <div>Settings</div>
                            </Link>
                        </Header>
                        <Body>
                            <Routes>
                                <Route path="/json" element={<JSONView/>}/>
                                <Route path="/example-view-1" element={<ExampleView1/>}/>
                                <Route path="/example-view-2" element={<ExampleView2/>}/>
                                <Route path="/open" element={<OpenProjectsView/>}/>
                                <Route path="/" element={<HomeView/>}/>
                                <Route path="/settings" element={<SettingsView/>}/>
                            </Routes>
                        </Body>
                        <Footer>
                            <StatusContainer>
                                {store.statusText} {store.totalMs > 0 &&
                              <progress value={store.elapsedMs} max={store.totalMs}/>}
                                {store.totalMs > 0 && <button onClick={() => {
                                    store.cancelProcess()
                                }}>Cancel</button>}
                            </StatusContainer>
                            <div/>
                            <MemoryContainer onClick={() => store.getWSUsedGB()}>
                                {store.usedMem.toFixed(2)} GB
                            </MemoryContainer>
                        </Footer>
                        <ContextMenu store={store.contextMenuStore}/>
                    </Content>
                </HashRouter>
            </ThemeProvider>
        </Fragment>
    );
});
export default MainLayout

