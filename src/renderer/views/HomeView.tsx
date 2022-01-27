import React from 'react'
import {useAppStore} from "@/renderer/core/AppStore";
import {observer} from "mobx-react";

const HomeView = observer(() => {
    let store = useAppStore()
    let counter = store.counter
    return (
        <div>
            <h1>Home</h1>
            <p>This is the initial view.</p>
            <p>{counter} <button onClick={() => store.counter++}>Hello</button></p>
        </div>
    );
});
export default HomeView
