import React, {useState, useEffect, useContext} from "react";
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import {useAppStore} from "@/renderer/core/AppStore";
import {useNavigate} from "react-router-dom";
import {GrCheckboxSelected} from "react-icons/gr";

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
    background: isDraggingOver ? 'lightblue' : 'transparent',
    display: 'flex',
    gap: 4,
    padding: grid,
    overflow: 'auto',
});

export interface PathsListProps {
    item
}

export const PathsList = observer((props: PathsListProps) => {
    let store = useAppStore()
    let projectC = store.getProjectController(props.item.id)

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
        store.saveLocalData()

    }
    let navigate = useNavigate()
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
                        {projectC.data.paths.map((path, index) => (
                            <Draggable key={path.id} draggableId={path.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                        )}
                                        onContextMenuCapture={() => {
                                            let index = store.contextMenuStore.menuOptions.findIndex((o) => o.name == 'Start')

                                            store.contextMenuStore.menuOptions.splice(index + 1, 0, {
                                                name: `Start ${path.path} Only`,
                                                icon: <GrCheckboxSelected/>,
                                                onClick: () => {
                                                    projectC.start(false);
                                                    navigate(`/`)
                                                }
                                            })

                                            store.contextMenuStore.menuOptions.splice(index + 2, 0, {
                                                name: `Select ${path.path} Only`,
                                                icon: <GrCheckboxSelected/>,
                                                onClick: () => {
                                                    projectC.selectAll(false);
                                                    projectC.select([path.path])
                                                    navigate(`/`)
                                                }
                                            })
                                        }}
                                    >
                                        {/*<div>{path.checked}</div>*/}

                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                projectC.select([path.path], null);
                                                navigate('/')
                                            }}>

                                        <input type={'checkbox'}
                                               disabled={!projectC.data.checked}
                                                    checked={path.checked}
                                                onChange={(e) => {
                                                    projectC.select([path.path], e.target.checked);
                                                    navigate('/')
                                                }}/>

                                            {path.path}
                                        </div>
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
