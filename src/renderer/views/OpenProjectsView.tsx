import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";

const Container = styled.div`
  display: grid;

`
const TitleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
`
const DirContainer = styled.div`
  display: grid;
  user-select: none;
  padding-left: 8px;
  padding-top: 8px;
  padding-bottom: 8px;

  :hover {
    background-color: rgba(173, 216, 230, 0.51);
  }
`
const NameContainer = styled.div`
  display: grid;
  font-weight: bold;
`
const PathContainer = styled.div`
  display: grid;
  font-size: 14px;
`
const SubdirsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;

  > div {
    width: max-content;
    font-size: 14px;
    font-style: italic;

  }

  gap: 0 10px;
  //gap: 4px;
`

export interface OpenProjectsViewProps {

}

export const OpenProjectsView = observer((props: OpenProjectsViewProps) => {
    let store = useAppStore()
    useEffect(() => {
        store.scanRegistredFolders()
    }, [])
    let filtering = store.filter
    let filteredResults = filtering ? store.scanResults.filter(project => project.name.toLowerCase().includes(store.filter.toLowerCase())) : store.scanResults
    return <Container>
        <TitleContainer>
            <h3>Open Projects ({filtering && `${filteredResults.length} / `}{store.scanResults.length})</h3>
            {/*Search box*/}
            <div>
                <input type="text" placeholder="Search" value={store.filter}
                       onChange={(e) => store.filter = e.target.value}/>
            </div>
        </TitleContainer>
        {filteredResults.map(result => {
            return <DirContainer key={result.path} onClick={() => store.importProject(result.path)}>
                <NameContainer>{result.name} </NameContainer>
                <PathContainer>{result.folder} ({result.path})</PathContainer>
                <SubdirsContainer>
                    {result.subdirs.map(subdir => {
                        return <div key={subdir} onClick={() => store.importProject(subdir)}>
                            {subdir}
                        </div>
                    })}
                </SubdirsContainer>
            </DirContainer>
        })}
    </Container>
})
