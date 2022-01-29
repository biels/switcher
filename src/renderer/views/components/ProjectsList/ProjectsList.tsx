import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import {useAppStore} from "@/renderer/core/AppStore";
import {PathsList} from "@/renderer/views/components/ProjectsList/components/PathsList";

const Container = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
`
const NameContainer = styled.span`
  font-size: 15px;
  font-weight: bold;

`
const PathContainer = styled.div`
  font-size: 14px;


`

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? "lightgreen" : "white",

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? "lightblue" : "lightgrey",
    padding: grid,
    width: '100%',
});


export interface ProjectsListProps {

}

export const ProjectsList = observer((props: ProjectsListProps) => {
    let store = useAppStore()
    // {featureId: FeatureId, data: FeatureData, }[]
    let projects = store.projects || [];
    let onDragEnd = function (result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const items = reorder(
            store.projects,
            result.source.index,
            result.destination.index
        );

        store.projects = items
        // store.saveFeaturesDebouncer()
    }
    return <Container onMouseDown={(e) => e.stopPropagation()}>

        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" type={'PROJECTS'}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}
                    >
                        {projects.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}

                                        style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                        )}
                                    >
                                        <div>
                                            <span {...provided.dragHandleProps}> # </span>{' '}
                                            <NameContainer>{item.name}</NameContainer>
                                        </div>
                                        <PathContainer>{item.rootPath}</PathContainer>
                                        <PathsList item={item}/>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>

    </Container>
})
