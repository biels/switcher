import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";

const Container = styled.div`
  display: grid;
  font-size: 14px;
`
// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const grid = 4;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? "lightgreen" : "#ddd",

    borderRadius: '100px',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'white',
    display: 'flex',
    gap: 4,
    padding: grid,
    overflow: 'auto',
});
export interface PathsListProps {
    item
}

export const PathsList = observer((props: PathsListProps) => {

    let onDragEnd = function (result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const items = reorder(
            props.item.paths,
            result.source.index,
            result.destination.index
        );

        props.item.paths = items
        // store.saveFeaturesDebouncer()
    }
    return <Container>
        {/*{props.item.paths.map(i => i.path)}*/}
        <DragDropContext onDragEnd={onDragEnd} type={`${props.item.id}`}>
            <Droppable droppableId={"droppable" + props.item.id} direction="horizontal">
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}
                    >
                        {props.item.paths.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id.toString()} index={index} >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                        )}
                                    >
                                        {/*<div>{item.id}</div>*/}
                                        <div>{item.path}</div>
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
