import icon from '../assets/icon-inspire.png'
import sourceLogo from '../assets/source-inspire.png'
import { encodeQueryData, QueryError, RateLimitError, urlproxy } from '../bib_lib'
import { api_bucket } from '../leaky_bucket'
import {  BasePaper, DataSource, DOWN, Paper, UP } from './document'
import { InspireToPaper } from './InspireFromJson'

const MAXCOUNT = 100

export class InspireDatasource implements DataSource {
    loaded: boolean = false
    aid: string

    recid: string = ''
    data: BasePaper

    max_count = MAXCOUNT
    email = 'feedback@inspirehep.net'
    help = `mailto:${this.email}`
    shortname = 'Inspire'
    longname = 'Inspire HEP'
    categories = new Set(['hep-th', 'hep-ex', 'hep-ph', 'hep-lat', 'gr-qc'])
    homepage = 'https://inspirehep.net'
    icon = icon
    logo = sourceLogo
    pagelength = MAXCOUNT

    // https://labs.inspirehep.net/api/literature?q=refersto:recid:1432705&sort=mostcited&page=1&size=5
    // https://labs.inspirehep.net/api/literature/1124337/references
    // https://labs.inspirehep.net/api/literature/1124337/citations?page=1&size=100&sort=mostcited
    // https://labs.inspirehep.net/api/literature?sort=mostcited&size=25&page=1&q=1207.7214
    // https://labs.inspirehep.net/api/literature?q=arxiv:1602.03837
    //

    url_paper = 'https://labs.inspirehep.net/literature'
    url_author = 'https://labs.inspirehep.net/authors'
    api_url = 'https://labs.inspirehep.net/api/literature'
    api_params = {
        sort: 'mostcited',
        page: 1,
        size: MAXCOUNT,
        q: 'a query'
    }

    sorting = {
        sorters: {
            paper: {name: 'Paper order', func: (i) => i.index  },
            //citations: {name: 'Citations', func: (i) => i.citation_count},
            title: {name: 'Title', func: (i) => i.simpletitle},
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname() },
            year: {name: 'Year', func: (i) => i.year}
        },
        sorters_order: ['title', 'author', 'year'],
        sorters_updown: {
            title: UP,
            author: UP,
            year: DOWN
        },
        sorters_default: 'year'
    }

    json_to_doc = new InspireToPaper(this)

    populate(base: BasePaper, citations: Paper[], references: Paper[]): void {
        const output = base
        output.citations = {
            documents: citations,
            header: 'Citations',
            header_url: output.url + '/citations',
            description: '',
            count: output.citation_count,
            sorting: this.sorting,
        }
        output.references = {
            documents: references,
            header: 'References',
            header_url: output.url + '/references',
            description: '',
            count: references.length,
            sorting: this.sorting,
        }
        this.data = output
    }

    fetch_params(query: string): string {
        const params = { ...this.api_params }
        if (!query) {
            delete params.q
        } else {
            params.q = query
        }
        return encodeQueryData(params)
    }

    format_url_search(query: string): string {
        return `${this.api_url}?${this.fetch_params(query)}`
    }

    format_url_rest(query: string): string {
        return `${this.api_url}/${query}?${this.fetch_params('')}`
    }

    /** Fetch for a query and return a Promise with Object parsed from JSON. */
    fetch_query(url: string): Promise<any> {
        return api_bucket.throttle(
            () => fetch(urlproxy(url)).then(resp => error_check(resp)).then(resp => resp.json())
        ).catch((e) => {
            if (e instanceof QueryError) {
                throw e
            } else if (e instanceof RateLimitError) {
                throw new Error('Too many requests, please try again in a few seconds.')
            } else {
                throw e
            }
        })
    }

    fetch_basepaper(aid: string): Promise<BasePaper> {
        const url = this.format_url_search(`eprint ${aid}`)
        return this.fetch_query(url)
        .then((json) => this.json_to_doc.json_search_to_meta(json))
        .then((json) => this.json_to_doc.metadata_to_paper(json, 0))
        .then((paper) => paper as BasePaper)
    }

    fetch_related(paper: BasePaper): Promise<any> {
        const recid = paper.recid
        return Promise.all([
            this.fetch_query(this.format_url_rest(`${recid}/references`)),
            this.fetch_query(this.format_url_search(`refersto:recid:${recid}`))
        ])
        .then((results) => {
            const [refs, cites] = results
            const list_refs = this.json_to_doc.json_references_to_papers(refs)
            const list_cites = this.json_to_doc.json_refersto_to_papers(cites)
            return [paper, list_cites, list_refs]
        })
        //this.fetch_query(`refersto:recid:${this.recid}`)
    }

    /** Fetches base, citations and references, then populates this InspireDatasource. */
    fetch_all(arxiv_id: string): Promise<InspireDatasource> {
        this.aid = arxiv_id

        if (this.loaded) {
            return new Promise<InspireDatasource>((resolve, reject) => resolve(this))
        }

        return this.fetch_basepaper(arxiv_id)
        .then((paper) => this.fetch_related(paper))
        .then((results) => {
            const [base, citations, references] = results
            this.populate(base, citations, references)
            this.loaded = true
            return this
        })
    }
}

function error_check(response: Response) {
    if (response.status === 200) {
        return response
    }

    switch (response.status) {
        case 0:
            throw new QueryError('Query prevented by browser -- CORS, firewall, or unknown error')
        case 404:
            throw new QueryError('No data available from data provider, article may be too recent, 404.')
        case 500:
            throw new QueryError('Query error 500: internal server error')
        default:
            throw new QueryError('Query error ' + response.status)
    }
}
