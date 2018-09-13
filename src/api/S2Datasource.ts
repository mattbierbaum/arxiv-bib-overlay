import icon from '../assets/icon-s2.png'
import sourceLogo from '../assets/source-s2.png'
import { BasePaper, DataSource, Paper } from './document'
import { S2ToPaper } from './S2FromJson'

export class S2Datasource implements DataSource {
    data: BasePaper
    cache: { [key: string]: Paper } = {}
    aid: string

    logo = sourceLogo
    icon = icon

    email = 'help@semanticscholar.org'
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
        return `${this.api_url}paper/arXiv:${arxivid}?${this.api_params}`
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
        this.aid = arxiv_id

        return fetch(this.url_paper(this.aid))
            .then(resp => resp.json())
            .then(json => {
                this.populate(json)
                return this
            })
    }
}
