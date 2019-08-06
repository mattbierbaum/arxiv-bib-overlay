import { action, computed, observable } from 'mobx'
import { POLICY_PERIODICALLY_REMIND_USERS, POLICY_REMINDER_PERIOD } from '../bib_config'
import { current_time } from '../bib_lib'
import { cookies } from '../cookies'
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
    errors: any[] = []

    @observable
    state: Status = Status.INIT

    @observable
    seen: boolean = false

    @observable
    show_alert: boolean = false

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
    init_from_cookies() {
        this.state = cookies.active ? Status.INIT : Status.DISABLED
        this.seen = cookies.seen

        // if it's on, definitely don't show them the alert
        if (!this.isdisabled) {
            this.show_alert = false
            return
        }

        // if this is their first time, definitely show it. undoubtedly, these parameters
        // are doubled up, but for historical reasons, let's keep them both for now FIXME
        if (!this.seen) {
            this.show_alert = true
            return
        }

        const time_stored = cookies.last_seen_time
        const time_current = current_time()
        this.show_alert = POLICY_PERIODICALLY_REMIND_USERS && (
            (time_current > time_stored + POLICY_REMINDER_PERIOD) || (time_current < time_stored)
        )
    }

    @action
    toggle() {
        if (this.isdisabled) {
            this.state = Status.INIT
            this.bibmodel.reloadSource()
            cookies.active = true
        } else {
            this.state = Status.DISABLED
            cookies.active = false
        }
        this.acknowledge()
    }

    @action
    acknowledge() {
        cookies.seen = true
        cookies.last_seen_time = current_time()
        this.seen = true
        this.show_alert = false
    }

    @action
    message(msg: string, exception: any = null) {
        this.messages.push(msg)
    }

    @action
    error(err: any, exception: any = null) {
        this.errors.push(err)
        this.state = Status.FAILED
    }
}

export const state: State = new State()
