import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";

const Container = styled.div`
    display: grid;
    
`

export interface JSONViewProps {

}

export const JSONView = observer((props: JSONViewProps) => {
    let store = useAppStore()
    // {featureId: FeatureId, data: FeatureData, }[]
    let projects = store.projects || [];
    return <Container>
        <pre>
            {JSON.stringify(projects, null, 2)}
        </pre>
    </Container>
})
