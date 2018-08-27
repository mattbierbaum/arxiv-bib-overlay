import { URL_PROXY } from './bib_config'

// BDC functions to access arxiv abs page info moved to arxiv_page.ts

export function encodeQueryData( data: {[key: string]: (string | string[] | number)} ) {
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

// BDC Doesn't seem used, save to get rid of
// $().remove() is used in some places

// Array.prototype.remove = function(element){
//     var index = this.indexOf(element)
//     if (index > -1) {
//         this.splice(index, 1)
//     }
// }
