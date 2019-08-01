/** Functions to interact with the arxiv page ex. getting the arXiv ID of the page. */

import { Author, Paper } from './api/document'

export const RE_IDENTIFIER = new RegExp(
    '(?:' +                                           // begin OR group
      '(?:arXiv:)(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)' + // there is a new-form arxiv id
        '|' +                                               // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)' +     // old-form id (not allowed by S2)
        '|' +                                               // OR
      '(?:^(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)$)' +     // new-form with no preamble
    ')'                                              // end OR group
)

export const RE_ARXIVID_URL = new RegExp(
    '^http(?:s)?://(?:.*\.)?arxiv.org/abs/' +       // we are on an abs page
    '(?:' +                                           // begin OR group
      '(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)' +         // there is a new-form arxiv id
        '|' +                                             // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)' +   // old-form id (not allowed by S2)
    ')' +                                             // end OR group
    '(?:#.*)?' +                                 // anchor links on page
    '(?:\\?.*)?$'                                // query parameter stuff
)

export const RE_CATEGORY_FULL = new RegExp(/\(([a-z\-]+(:?\.[a-zA-Z\-]+)?)\)/g)
export const RE_CATEGORY_MAJOR = new RegExp(/([a-z\-]+)(:?\.[a-zA-Z\-]+)?/g)

function allmatches(str: string , regex: RegExp, index: number): string[] {
    const matches: string[] = []
    let match = regex.exec(str)
    while (match !== null) {
        matches.push(match[index])
        match = regex.exec(str)
    }
    return matches || ['']
}

function element_text(elem_selector: string): string {
    const obj = document.body.querySelector(elem_selector) as HTMLElement
    if (obj && obj.textContent) {
        return obj.textContent
    }
    return ''
}

function meta_text(elem_name: string): string {
    const obj = document.head.querySelector(`[name="${elem_name}"]`) as HTMLMetaElement
    return obj ? obj.content : ''
}

function meta_texts(elem_name: string): string[] {
    const objs = Array.from(document.head.querySelectorAll(`[name="${elem_name}"]`))
    const texts: string[] = []
    for (const obj of objs) {
        const o = obj as HTMLMetaElement
        texts.push(o.content)
    }
    return texts
}

//=============================================================
// category extraction methods
function minor_to_major(category: string): string {
    // extract the major category from a full minor category
    const match = allmatches(category, RE_CATEGORY_MAJOR, 1)
    return match ? match[0] : ''
}

function get_minor_categories_primary(): string[] {
    const txt = element_text('.primary-subject')
    return allmatches(txt, RE_CATEGORY_FULL, 1)
}

function get_minor_categories_all(): string[] {
    // find the entries in the table which look like
    // (cat.MIN) -> (cs.DL, math.AS, astro-ph.GD)
    // also, (hep-th)
    const txt = element_text('.metatable .subjects')
    return allmatches(txt, RE_CATEGORY_FULL, 1)
}

function get_minor_categories(): string[] {
    return get_minor_categories_primary() || get_minor_categories_all()
}

export function get_categories(): string[][] {
    return get_minor_categories().map((cat) => [minor_to_major(cat), cat])
}

export function get_primary_category(): string {
    const cats: string[][] = get_categories()
    if (cats && cats.length > 0 && cats[0].length > 0) {
        return cats[0][0]
    }

    throw new Error('No primary category found')
}

//=============================================================
// article id extraction functions
function get_current_article_url(): string {
    const url = document.location.href
    const match = RE_ARXIVID_URL.exec(url)

    if (!match) {
        console.log('No valid match could be found for article ID')
        return ''
    }

    const aid = match[0]    
    if (!aid || aid.length <= 5) {
        console.log('No valid article ID extracted from the browser location.')
        return ''
    }

    return aid
}

function get_current_article_meta(): string {
    return meta_text('citation_arxiv_id')
}

export function get_current_article(): string {
    return get_current_article_meta() || get_current_article_url()
}

export function get_current_article_doi(): string {
    return meta_text('citation_doi')
}

//=============================================================
// extract other article metadata from the abstract page
export function get_article_info(): any {
    return {
        title: meta_text('citation_title'),
        author: meta_text('citation_author'),
        year: meta_text('citation_date').split('/')[0],
    }
}

//==============================================================
// functions that return page elements related to the arxiv page
function pageElement(name: string, container: string,  insertbefore: string): HTMLElement {
    const onpage = document.getElementById(name)
    if (onpage) {
        return onpage
    }

    const main = document.createElement('div')
    main.id = name
    main.className = name

    const elemContainer = document.getElementsByClassName(container)[0]
    const elemInsertBefore = document.getElementsByClassName(insertbefore)[0]
    elemContainer.insertBefore(main, elemInsertBefore)
    return main as HTMLElement
}

export function pageElementMain(): HTMLElement {
    return pageElement('bib-main', 'leftcolumn', 'submission-history')
}

export function pageElementSidebar(): HTMLElement {
    return pageElement('bib-sidebar', 'extra-services', 'bookmarks')
}

export function pageElementModal(): HTMLElement {
    return pageElement('bib-modal', 'extra-services', 'bookmarks')
}

//==============================================================
// returns the current paper as a Paper object
export function topaper(): Paper {
    const out = new Paper()
    out.title = meta_text('citation_title')
    out.year = meta_text('citation_date').substr(0, 4)
    out.venue = 'arXiv'
    out.doi = meta_text('citation_doi')
    out.arxivId = get_current_article()
    out.url = document.location.href
    out.authors = []

    const authnames = meta_texts('citation_author')
    for (const auth of authnames) {
        const a = new Author()
        a.name = auth
        out.authors.push(a)
    }
    return out
}
