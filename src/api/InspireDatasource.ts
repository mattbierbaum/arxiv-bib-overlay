import icon from '../assets/icon-inspire.png'
import sourceLogo from '../assets/source-inspire.png'
import { API_ARTICLE_COUNT } from '../bib_config'
import { encodeQueryData, urlproxy } from '../bib_lib'
import {  BasePaper, DataSource, Paper } from './document'
import { InspireToPaper } from './InspireFromJson'

export class InspireDatasource implements DataSource {
    loaded: boolean = false
    aid: string

    data: BasePaper

    max_count = API_ARTICLE_COUNT
    email = 'feedback@inspirehep.net'
    shortname = 'Inspire'
    longname = 'Inspire HEP'
    categories = new Set(['hep-th', 'hep-ex', 'hep-ph', 'hep-lat', 'gr-qc'])
    homepage = 'https://inspirehep.net'
    icon = icon
    logo = sourceLogo
    pagelength = 250

    api_url = 'https://inspirehep.net/search'
    api_params = {
        p:  'a query',  // pattern (query)
        of: 'recjson',  // output format
        ot: [           // output tags
            'recid',
            'title',
            'doi',
            'authors',
            'number_of_citations',
            'publication_info',
            'primary_report_number',
            'cataloguer_info',
            'system_control_number',
            'prepublication',
            'creation_date',
        ],
        rg: API_ARTICLE_COUNT,      // records in groups of
        sf: 'number_of_citations',  // sort field: citation count
        so: 'a',                    // sort order: descending
        jrec: 0     // jump to record
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
        sorters_default: 'citations',
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

    fetch_params(query: string, index: number): string {
        const params = { ...this.api_params }
        params.p = query
        params.jrec = index * this.pagelength
        return encodeQueryData(params)
    }

    /** Fetch for a query and return a Promise with Object parsed from JSON. */
    fetch_docs(query: string, index: number): Promise<any> {
        const url = this.api_url + '?' + this.fetch_params(query , index)
        return fetch(urlproxy(url))
            .then(resp => resp.json())
            .then(json => this.json_to_doc.reformat_documents(json))
    }

    /** Fetches base, citations and references, then populates this InspireDatasource. */
    fetch_all(arxiv_id: string): Promise<InspireDatasource> {
        if (this.loaded) {
            return new Promise<InspireDatasource>((resolve, reject) => resolve(this))
        }

        this.aid = arxiv_id
        return Promise.all(
            [this.fetch_docs('eprint:' + this.aid,  0),
            this.fetch_docs('refersto:eprint:' + this.aid, 0),
            this.fetch_docs('citedby:eprint:' + this.aid, 0)]
        ).then((results) => {
            const [base, citations, references] = results
            this.populate(base[0], citations, references)
            this.loaded = true
            return this
        })
    }
}
