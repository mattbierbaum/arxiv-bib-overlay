import * as Cookie from 'js-cookie'
import { COOKIE_ACTIVE } from './bib_config'

const LocalCookies = Cookie

export function cookie_save(active: boolean) {
    LocalCookies.set(COOKIE_ACTIVE, active)
}

export function cookie_load(): boolean {
    let active = LocalCookies.get(COOKIE_ACTIVE)

    /* let's define this cookie after the first usage */
    if (active === undefined) {
        active = true
    }

    if (active === 'true') { active = true }
    if (active === 'false') { active = false }

    LocalCookies.set(COOKIE_ACTIVE, active)
    return active
}
