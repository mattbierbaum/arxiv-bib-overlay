/** Functions to interact with the arxiv page ex. getting the arXiv ID of the page. */
import { EXTENSION_ASSET_BASE, URL_ASSET_BASE } from './bib_config'

export const RE_IDENTIFIER = new RegExp(
    '(?:' +                                           // begin OR group
      '(?:arXiv:)(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)' +   // there is a new-form arxiv id
        '|' +                                             // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)' +   // old-form id (not allowed by S2)
        '|' +
      '(?:^(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)$)' +   // new-form with no preamble
    ')'                                              // end OR group
)

export const RE_ARXIVID_URL = new RegExp(
    '^http(?:s)?://(?:.*\.)?arxiv.org/abs/' +             // we are on an abs page
    '(?:' +                                           // begin OR group
      '(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)' +       // there is a new-form arxiv id
        '|' +                                            // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)' + // old-form id (not allowed by S2)
    ')' +                                             // end OR group
    '(?:#.*)?' +                                 // anchor links on page
    '(?:\\?.*)?$'                               // query parameter stuff
)

export const RE_CATEGORY_FULL = new RegExp(/\(([a-z\-]+(:?\.[a-zA-Z\-]+)?)\)/g)
export const RE_CATEGORY_MAJOR = new RegExp(/([a-z\-]+)(:?\.[a-zA-Z\-]+)?/g)

export function random_id() {
    return String(Math.random()).substring(2, 12)
}

function allmatches(str: string , regex: RegExp, index: number): string[] {
    const matches: string[] = []
    let match = regex.exec(str)
    while (match !== null) {
        matches.push(match[index])
        match = regex.exec(str)
    }
    return matches
}

function element_text(obj: HTMLElement): string {
    if (obj && obj.textContent) {
        return obj.textContent
    }
    return ''
}

//=============================================================
// category extraction methods
function minor_to_major(category: string) {
    // extract the major category from a full minor category
    const match = allmatches(category, RE_CATEGORY_MAJOR, 1)
    return match ? match[0] : ''
}

function get_minor_categories_primary(): string[] {
    const obj = document.body.querySelector('.primary-subject') as HTMLElement
    const txt = element_text(obj)
    return allmatches(txt, RE_CATEGORY_FULL, 1)
}

function get_minor_categories_all() {
    // find the entries in the table which look like
    // (cat.MIN) -> (cs.DL, math.AS, astro-ph.GD)
    // also, (hep-th)
    const obj = document.body.querySelector('.metatable .subjects') as HTMLElement
    const txt = element_text(obj)
    return allmatches(txt, RE_CATEGORY_FULL, 1)
}

function get_minor_categories(): string[] {
    return get_minor_categories_primary() || get_minor_categories_all()
}

export function get_categories() {
    return get_minor_categories().map( (cat) => [minor_to_major(cat), cat] )
}

//=============================================================
// article id extraction functions
function get_current_article_url() {
    const url = document.location.href
    const match = RE_ARXIVID_URL.exec(url)

    if (!match) {
        console.log('No valid match could be found for article ID')
        return
    }

    const aid = match[0]    
    if (!aid || aid.length <= 5) {
        console.log('No valid article ID extracted from the browser location.')
        return
    }

    return aid
}

function get_current_article_meta() {
    const obj = document.head.querySelector('[name="citation_arxiv_id"]') as HTMLMetaElement
    return obj ? obj.content : null
}

export function get_current_article() {
    return get_current_article_meta() || get_current_article_url()
}

//=============================================================
// article id extraction functions
export function asset_url(url: string) {
    let output = ''
    try {
        // @ts-ignore
        output = chrome.extension.getURL(EXTENSION_ASSET_BASE + url)
    } catch (err) {
        output = URL_ASSET_BASE + url
    }
    return output
}
