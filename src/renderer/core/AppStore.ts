import "reflect-metadata"
import {container, inject, singleton} from "tsyringe";
import {makeAutoObservable, makeObservable, observable} from "mobx";

export let useAppStore = () => {
    return container.resolve(AppStore);
};

@singleton()
export class AppStore {
    @observable
    projects: any[] = [
        {id: '1',
            open: [
                {path: 'C:\\Users\\biel\\projects\\bis\\bis-admin'}
            ]
        }
    ]
    @observable
    counter = 0
    constructor() {
        makeAutoObservable(this)
    }

    openWS(){
        let path = `C:\\Users\\biel\\projects\\bis\\bis-admin`

    }
}
