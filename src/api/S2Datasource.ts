import icon from '../assets/icon-s2.png'
import sourceLogo from '../assets/source-s2.png'
import { encodeQueryData } from '../bib_lib'
import { BasePaper, DataSource } from './document'
import { S2ToPaper } from './S2FromJson'

export class S2Datasource implements DataSource {
    data: BasePaper
    loaded: boolean = false
    aid: string

    logo = sourceLogo
    icon = icon

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
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname()},
            title: {name: 'Title', func: (i) => i.title.toLowerCase()},
            year: {name: 'Year', func: (i) => i.year},
        },
        sorters_order: ['influence', 'title', 'author', 'year'],
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
                documents: json.citations.map((doc) => this.json_to_doc.reformat_document(doc, 0)),
                header: 'Citations',
                header_url: `${json.url}#citingPapers`,
                description: 'highly influenced citations',
                count: json.citations.length,
                sorting: this.sorting,
            }
        }

        if (json.references) {
            output.references = {
                documents: json.references.map((doc) => this.json_to_doc.reformat_document(doc, 0)),
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

        return fetch(this.url_paper(this.aid))
            .then(resp => error_check(resp))
            .then(resp => resp.json())
            .then(json => {
                this.populate(json)
                this.loaded = true
                return this
            })
    }
}

function error_check(response: Response) {
    /*switch (t) {
        case 'timeout':
            var n = Number.parseFloat(bib_config.API_TIMEOUT/1000).toFixed(1);
            throw new Error('Query timed out ('+n+' sec limit)');
        case 'parseerror':
            throw new Error('Query returned malformed data');
        case 'nocontent':
            throw new Error('Query returned no data');
        default:
            break;
    }*/

    console.log(response)
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

//function error_handle(err) {
//    console.log(err)
//}

//function error_check(response) {
//    console.log(response)
//    return response
//}
