import icon from '../assets/icon-prophy.png'
import sourceLogo from '../assets/source-prophy.png'
import { CATEGORIES, encodeQueryData } from '../bib_lib'
import { api_bucket } from '../leaky_bucket'
import { BasePaper, DataSource, DOWN, QueryError, UP } from './document'
import { ProphyToPaper } from './ProphyFromJson'

export class ProphyDatasource implements DataSource {
    data: BasePaper
    loaded: boolean = false
    aid: string

    logo = sourceLogo
    icon = icon

    max_count = 999
    email = 'arxiv@prophy.science'
    shortname = 'Prophy'
    longname = 'Prophy'
    categories = CATEGORIES

    homepage = 'https://www.prophy.science'
    api_url = 'https://www.prophy.science/api'
    api_params = {
        include_unknown_references: 1,
    }

    sorting = {
        sorters: {
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname().toLowerCase()},
            title: {name: 'Title', func: (i) => i.simpletitle},
            year: {name: 'Year', func: (i) => i.year},
        },
        sorters_order: ['title', 'author', 'year'],
        sorters_updown: {
            title: UP,
            author: UP,
            year: DOWN
        },
        sorters_default: 'year',
    }

    json_to_doc = new ProphyToPaper(this)

    url_paper(arxivid: string) {
        const params = encodeQueryData(this.api_params)
        return `${this.api_url}/arxiv/${arxivid}?${params}`
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

    fetch_all(arxiv_id: string): Promise<ProphyDatasource> {
        if (this.loaded) {
            return new Promise<ProphyDatasource>((resolve, reject) => resolve(this))
        }

        this.aid = arxiv_id

        return api_bucket.throttle(
            () => fetch(this.url_paper(this.aid))
                .catch((e) => {
                    console.log(e)
                    throw new QueryError('Query prevented by browser -- CORS, firewall, or unknown error')}
                )
                .then(resp => error_check(resp))
                .then(resp => resp.json())
                .then(json => {
                    console.log(json) 
                    this.populate(json)
                    this.loaded = true
                    return this
                })
        ).catch((e) => {
            if (e instanceof QueryError) {
                throw e
            } else {
                throw new Error('Too many requests, please try again in a few seconds.')
            }
        })
    }
}

function error_check(response: Response) {
    if (response.status === 200) {
        return response
    }

    switch (response.status) {
        case 0:
            console.log(response)
            throw new QueryError('Query prevented by browser -- CORS, firewall, or unknown error')
        case 404:
            throw new QueryError('No data available yet')
        case 500:
            throw new QueryError('Query error 500: internal server error')
        default:
            throw new QueryError('Query error ' + response.status)
    }
}
