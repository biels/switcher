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
            <p>{counter}
                <button onClick={() => store.counter++}>Hello</button>
            </p>
            <button onClick={() => store.openWS([`C:\\Users\\biel\\projects\\switcher`])}>Open switcher</button>
            <button onClick={() => store.openWS([`C:\\Users\\biel\\projects\\switcher`], false)}>Open switcher no
                close
            </button>
            <button onClick={() => store.openWS()}>Open all</button>
            <button onClick={() => store.stopWS(false)}>Close WS</button>
            <div>
                <progress value={store.elapsedMs} max={store.totalMs}/>

            </div>
            <div>
                <button onClick={() => store.getWSUsedGB()}>Get used memory</button>
                <div>{store.usedMem.toFixed(2)} GB</div>
            </div>
        </div>
    );
});
export default HomeView
