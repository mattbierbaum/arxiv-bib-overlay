import icon from '../assets/icon-s2.png'
import sourceLogo from '../assets/source-s2.png'
import { encodeQueryData } from '../bib_lib'
import { api_bucket } from '../leaky_bucket'
import { BasePaper, DataSource, DOWN, UP } from './document'
import { S2ToPaper } from './S2FromJson'

export class S2Datasource implements DataSource {
    data: BasePaper
    loaded: boolean = false
    aid: string

    logo = sourceLogo
    icon = icon

    max_count = 999
    email = 'feedback@semanticscholar.org'
    shortname = 'S2'
    longname = 'Semantic Scholar'
    categories = new Set(['cs', 'stat.ML'])
    homepage = 'https://semanticscholar.org'
    api_url = 'https://api.semanticscholar.org/v1/'
    api_params = {include_unknown_references: 'true'}

    sorting = {
        sorters: {
            paper: {name: 'Paper order', func: (i) => i.index},
            influence: {name: 'Influence', func: (i) => i.isInfluential},
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname().toLowerCase()},
            title: {name: 'Title', func: (i) => i.simpletitle},
            year: {name: 'Year', func: (i) => i.year},
        },
        sorters_order: ['influence', 'title', 'author', 'year'],
        sorters_updown: {
            influence: DOWN,
            title: UP,
            author: UP,
            year: DOWN
        },
        sorters_default: 'influence',
    }

    json_to_doc = new S2ToPaper(this)

    url_paper(arxivid: string) {
        const params = encodeQueryData(this.api_params)
        return `${this.api_url}paper/arXiv:${arxivid}?${params}`
    }

    populate(json: any) {
        const output: BasePaper = this.json_to_doc.reformat_document(json, 0)

        if (json.citations) {
            output.citations = {
                documents: json.citations.map((doc, index) => this.json_to_doc.reformat_document(doc, index)),
                header: 'Citations',
                header_url: `${json.url}#citingPapers`,
                description: 'highly influenced citations',
                count: json.citations.length,
                sorting: this.sorting,
            }
        }

        if (json.references) {
            output.references = {
                documents: json.references.map((doc, index) => this.json_to_doc.reformat_document(doc, index)),
                header: 'References',
                header_url: `${json.url}#citedPapers`,
                description: 'highly influenced references',
                count: json.references.length,
                sorting: this.sorting,
            }
        }

        this.data = output
    }

    fetch_all(arxiv_id: string): Promise<S2Datasource> {
        if (this.loaded) {
            return new Promise<S2Datasource>((resolve, reject) => resolve(this))
        }

        this.aid = arxiv_id

        return api_bucket.throttle(
            () => fetch(this.url_paper(this.aid))
                .catch((e) => {throw new Error('Query prevented by browser -- CORS, firewall, or unknown error')})
                .then(resp => error_check(resp))
                .then(resp => resp.json())
                .then(json => {
                    this.populate(json)
                    this.loaded = true
                    return this
                })
        ).catch((e) => {throw new Error('Too many requests, throttled')})
    }
}

function error_check(response: Response) {
    if (response.status === 200) {
        return response
    }

    switch (response.status) {
        case 0:
            throw new Error('Query prevented by browser -- CORS, firewall, or unknown error')
        case 404:
            throw new Error('No data available yet')
        case 500:
            throw new Error('Query error 500: internal server error')
        default:
            throw new Error('Query error ' + response.status)
    }
}
