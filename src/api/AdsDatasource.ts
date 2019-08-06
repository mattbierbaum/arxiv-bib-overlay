import sourceIcon from '../assets/icon-ads.png'
import sourceLogo from '../assets/source-ads.png'
import { POLICY_ADS_OAUTH_SERVICE } from '../bib_config'
import { DataError, encodeQueryData, QueryError } from '../bib_lib'
import { api_bucket } from '../leaky_bucket'
import { AdsToPaper } from './AdsFromJson'
import {  BasePaper, DataSource, DOWN, Paper, UP } from './document'

const ADS_API_COUNT = 100

/** Class to fetch references from ADS. */
export class AdsDatasource implements DataSource {
    credentials: string = ''
    loaded: boolean = false
    aid: string

    data: BasePaper

    icon = sourceIcon
    logo = sourceLogo

    email = 'adshelp@cfa.harvard.edu'
    help = `mailto:${this.email}`
    shortname = 'ADS'
    longname = 'NASA ADS'
    categories = new Set(['astro-ph', 'cond-mat', 'gr-qc'])

    max_count = ADS_API_COUNT
    base_url = 'https://api.adsabs.harvard.edu'
    homepage = 'https://ui.adsabs.harvard.edu'
    outbound_url = 'https://ui.adsabs.harvard.edu'
    token_url = 'https://bibex-ads-token.development.arxiv.org/token'
    api_url = `${this.base_url}/v1/search/query`
    api_key = '3vgYvCGHUS12SsrgoIfbPhTHcULZCByH8pLODY1x'

    api_params = {
        q: 'a query',
        fl: [
            'id', 'pub', 'bibcode', 'title', 'author', 'bibstem',
            'year', 'doi', 'citation_count', 'read_count', 'identifier'
        ],
        rows: ADS_API_COUNT,
        sort: 'citation_count desc',
    }

    sorting = {
        sorters: {
            paper: {name: 'Paper order', func: (i) => i.index  },
            citations: {name: 'Citations', func: (i) => i.citation_count},
            influence: {name: 'ADS read count', func: (i) => i.read_count},
            title: {name: 'Title', func: (i) => i.simpletitle},
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname() },
            year: {name: 'Year', func: (i) => i.year}
        },
        sorters_order: ['citations', 'influence', 'title', 'author', 'year'],
        sorters_updown: {
            citations: DOWN,
            influence: DOWN,
            title: UP,
            author: UP,
            year: DOWN
        },
        sorters_default: 'citations'
    }

    ads_url_ui = `${this.outbound_url}/#search/`

    json_to_doc = new AdsToPaper(this)

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
            sorting: this.sorting
        }

        const ncites = output.citations.count
        const nrefs = output.references.count

        if (nrefs === 0 || (ncites === 0 && nrefs === 0)) {
            throw new DataError('No references or citations provided by data provider.')
        }

        this.data = output
    }

    get_credentials(): Promise<void> {
        const credstr: 'include' = 'include'
        const options = {credentials: credstr}
        return fetch(this.token_url, options)
            .catch((e) => {throw new QueryError('Token query prevented by browser - CORS, firewall, or unknown error')})
            .then(resp => error_check_token(resp))
            .then(resp => resp.json())
            .then(json => {this.credentials = json.token})
    }

    fetch_params(query: string, index: number): string {
        const params = { ...this.api_params }
        params.q = query
        return encodeQueryData(params)
    }

    /* Fetch for a query and return a Promise with Object parsed from JSON. */
    fetch_docs(query: string, index: number): Promise <any> {
        const url = `${this.api_url}?${this.fetch_params(query , index)}`
        //const modestr: 'no-cors' = 'no-cors'
        //const headers = {mode: modestr, headers: {Authorization: `Bearer ${this.api_key}`}}
        const credentials = POLICY_ADS_OAUTH_SERVICE ? this.credentials : this.api_key
        const headers = {headers: {Authorization: `Bearer ${credentials}`}}

        return api_bucket.throttle(
            () => fetch(url, headers)
            .catch((e) => {throw new QueryError('Query prevented by browser -- CORS, firewall, or unknown error')})
            .then(resp => error_check(resp))
            .then(resp => resp.json())
            .then(json => this.json_to_doc.reformat_documents(json.response.docs))
        ).catch((e) => {throw e})
    }

    /* Fetches base, citations and references, then populates this InspireDatasource. */
    fetch_all(arxiv_id: string): Promise <AdsDatasource> {
        if (POLICY_ADS_OAUTH_SERVICE && !this.credentials) {
            return this.get_credentials().then(() => this.fetch_all(arxiv_id))
        }

        if (this.loaded) {
            return new Promise<AdsDatasource>((resolve, reject) => resolve(this))
        }

        this.aid = arxiv_id
        return Promise.all([
            this.fetch_docs(`arXiv:${arxiv_id}`,  0),
            this.fetch_docs(`citations(arXiv:${arxiv_id})`, 0),
            this.fetch_docs(`references(arXiv:${arxiv_id})`, 0)
        ]).then((results) => {
            const [base, citations, references] = results
            this.populate(base[0], citations, references)
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
        case 401:
            throw new QueryError('Query authentication to ADS failed')
        case 404:
            throw new DataError('No data available yet')
        case 429:
            throw new QueryError('Too many requests to ADS, rate limit reached for today.')
        case 500:
            throw new QueryError('Query error 500: internal server error')
        default:
            throw new QueryError('Query error ' + response.status)
    }
}

function error_check_token(response: Response) {
    if (response.status === 200) {
        return response
    }

    switch (response.status) {
        case 0:
            throw new QueryError('ADS token blocked by browser -- CORS, firewall, or unknown error')
        case 404:
            throw new QueryError('Token server (managed by arXiv) not found')
        default:
            throw new QueryError(`Error retrieving ADS API Token ${response.status}`)
    }
}
