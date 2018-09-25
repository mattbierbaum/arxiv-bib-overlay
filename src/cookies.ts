import * as Cookie from 'js-cookie'
import { COOKIE_PREFIX, POLICY_DEFAULT_ISACTIVE, POLICY_REMEMBER_DATASOURCE } from './bib_config'

const enum COOKIE_NAMES {
    ACTIVE = 'active',
}

class Cookies {
    localCookies = Cookie

    cname(name: string) {
        // convert short name to cookie name
        return `${COOKIE_PREFIX}_${name}`
    }

    dsname(name: string) {
        // convert datasource to cookie name
        return `ds_${name.toLowerCase()}`
    }

    get_value(name: string) {
        return this.localCookies.get(this.cname(name))
    }

    set_value(name: string, value: any) {
        this.localCookies.set(this.cname(name), value)
    }

    set active(active: boolean) {
        this.set_value(COOKIE_NAMES.ACTIVE, active)
    }

    get active(): boolean {
        let active = this.get_value(COOKIE_NAMES.ACTIVE)

        /* let's define this cookie after the first usage */
        if (active === undefined) {
            active = POLICY_DEFAULT_ISACTIVE
        }

        if (active === 'true') { active = true }
        if (active === 'false') { active = false }

        this.set_value(COOKIE_NAMES.ACTIVE, active)
        return active
    }

    get_datasource(category: string): string {
        if (!POLICY_REMEMBER_DATASOURCE) {
            return ''
        }

        const val = this.get_value(this.dsname(category))
        return val || ''
    }

    set_datasource(category: string, value: string) {
        if (!POLICY_REMEMBER_DATASOURCE) {
            return
        }

        this.set_value(this.dsname(category), value)
    }
}

export const cookies: Cookies = new Cookies()
