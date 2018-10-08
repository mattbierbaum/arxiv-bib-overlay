import * as Cookie from 'js-cookie'
import * as CONFIG from './bib_config'

const enum COOKIE_NAMES {
    ACTIVE = 'active',
    SEEN = 'seen'
}

class Cookies {
    localCookies = Cookie

    dsname(name: string) {
        // convert datasource to cookie name
        return `ds_${name.toLowerCase()}`
    }

    get_value(name: string) {
        const txtjson = this.localCookies.get(CONFIG.POLICY_COOKIE_NAME)
        if (!txtjson) {
            return null
        }

        const json = JSON.parse(txtjson)
        return json[name]
    }

    set_value(name: string, value: any) {
        const txtjson = this.localCookies.get(CONFIG.POLICY_COOKIE_NAME)

        const attr = {expires: CONFIG.POLICY_COOKIE_EXPIRATION}
        const json = txtjson ? JSON.parse(txtjson) : {}
        json[name] = value
        this.localCookies.set(CONFIG.POLICY_COOKIE_NAME, JSON.stringify(json), attr)
    }

    get_boolean(name: string, default_value: boolean) {
        let value = this.get_value(name)

        if (value === undefined || value === null) {
            value = default_value
        }

        //console.log(typeof(value))
        //if (value === 'true') { value = true }
        //if (value === 'false') { value = false }

        this.set_value(name, value)
        return value
    }

    set_boolean(name: string, value: boolean) {
        this.set_value(name, value) 
    }

    set active(active: boolean) {
        this.set_boolean(COOKIE_NAMES.ACTIVE, active)
    }

    get active(): boolean {
        return this.get_boolean(COOKIE_NAMES.ACTIVE, CONFIG.POLICY_DEFAULT_ENABLED)
    }

    set seen(seen: boolean) {
        this.set_boolean(COOKIE_NAMES.SEEN, seen)
    }

    get seen(): boolean {
        return this.get_boolean(COOKIE_NAMES.SEEN, false)
    }

    get_datasource(category: string): string {
        if (!CONFIG.POLICY_REMEMBER_DATASOURCE) {
            return ''
        }

        const val = this.get_value(this.dsname(category))
        return val || ''
    }

    set_datasource(category: string, value: string) {
        if (!CONFIG.POLICY_REMEMBER_DATASOURCE) {
            return
        }

        this.set_value(this.dsname(category), value)
    }
}

export const cookies: Cookies = new Cookies()
