import { URL_PROXY } from './bib_config'

export const CATEGORIES = new Set([
  'astro-ph', 'cond-mat', 'cs', 'gr-qc', 'hep-ex', 'hep-lat', 'hep-ph',
  'hep-th', 'math-ph', 'nlin', 'nucl-ex', 'nucl-th', 'physics', 'quant-ph',
  'math', 'q-bio', 'q-fin', 'stat', 'eess', 'econ'
])

export function current_time(): number {
    return Math.floor((new Date()).getTime() / 1000)
}

export function random_id(): string {
    return Math.random().toString().substring(2, 12)
}

export function encodeQueryData(data: {[key: string]: (string | string[] | number)}) {
    const ret: string[] = []    
    for (const key of Object.getOwnPropertyNames(data)) {
        const val = data[key]
        const valv = !Array.isArray(val) ? [val] : val

        for (const vvv of valv) {
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent('' + vvv))
        }
    }
    return ret.join('&')
}

export function urlproxy(url: string) {
    if (URL_PROXY) {
        return URL_PROXY + '?url=' + encodeURIComponent(url)
    }
    return url
}

export function normalize_whitespace(data: string): string {
    return data.replace(/\s+/g, ' ')
}

export function remove_puctuation(data: string): string {
    //return data.replace(/[.,\/#!$%\^&\*;:{}=\-_~()"'\\\[\]]/gmi, '')
    return data.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/gmi, '')
}

export class QueryError extends Error {
    constructor(m: string) {
        super(m)
        Object.setPrototypeOf(this, QueryError.prototype)
        this.name = 'QueryError'
    }
}

export class DataError extends Error {
    constructor(m: string) {
        super(m)
        Object.setPrototypeOf(this, QueryError.prototype)
        this.name = 'DataError'
    }
}

export class RateLimitError extends Error {
    constructor(m: string) {
        super(m)
        Object.setPrototypeOf(this, RateLimitError.prototype)
        this.name = 'RateLimitError'
    }
}
