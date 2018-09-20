import { URL_PROXY } from './bib_config'

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
