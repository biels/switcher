import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {useAppStore} from "@/renderer/core/AppStore";
import json5 from "json5";

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
            {json5.stringify(projects.map(p => p.data), null, 2)}
        </pre>
    </Container>
})
