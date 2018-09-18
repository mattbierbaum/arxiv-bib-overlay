import { action, computed, observable } from 'mobx'
import { BibModel } from './BibModel'

export enum Status {
    LOADED = 'loaded',
    LOADING = 'loading',
    FAILED = 'failed',
    INIT = 'init',
    DISABLED = 'disabled'
}

export class State {
    @observable
    bibmodel: BibModel = new BibModel()

    @observable
    messages: string[] = []

    @observable
    errors: string[] = []

    @observable
    state: Status = Status.INIT

    @computed
    get isfailed(): boolean {
        return this.state === Status.FAILED
    }

    @computed
    get isloaded(): boolean {
        return this.state === Status.LOADED
    }

    @computed
    get isloading(): boolean {
        return this.state === Status.LOADING
    }

    @computed
    get isdisabled(): boolean {
        return this.state === Status.DISABLED
    }

    @action
    message(msg: string, exception: any = null) {
        this.messages.push(msg)
    }

    @action
    error(msg: string, exception: any = null) {
        console.log(msg)
        this.errors.push(msg)
        this.state = Status.FAILED
    }
}

export const state: State = new State()
