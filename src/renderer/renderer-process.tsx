import "reflect-metadata"
import { render } from "react-dom";
import React from "react";
import MainLayout from "./MainLayout";
import {configure} from "mobx";
configure({
    enforceActions: "never",
    computedRequiresReaction: false,
    reactionRequiresObservable: true,
    observableRequiresReaction: false,
    disableErrorBoundaries: true,

})
render(<MainLayout />, document.getElementById("root"));
