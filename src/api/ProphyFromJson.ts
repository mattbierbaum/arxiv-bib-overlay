//import { RE_IDENTIFIER } from '../arxiv_page'
//import * as unidecode from 'unidecode'
import { encodeQueryData, remove_puctuation } from '../bib_lib'
import { Author, Paper } from './document'
import { ProphyDatasource } from './ProphyDatasource'

function remove_title_dates(title: string): string {
    // Remove things from Prophy titles that look like:
    //      1 1 A pr 2 01 8
    //      1 S ep 2 01 6
    //      2 5 O ct 2 01 6
    return title.replace(/^(?:\d\s*){1,2}(?:[A-Za-z]\s*){2,4}\s*(?:\d\s*){4,}/, '')
}

export class ProphyToPaper {
    fetchConfig: ProphyDatasource

    constructor(fetch_config: ProphyDatasource) {
        this.fetchConfig = fetch_config
    }

    url_author(id: string) {
        return `${this.fetchConfig.api_url}author/${id}`
    }

    url_api(json: any) {
        const params = encodeQueryData(this.fetchConfig.api_params)
        return json.paperId ? `${this.fetchConfig.api_url}paper/${json.paperId}?${params}` : ''
    }

    url_arxiv(json: any) {
        return json.arxivId ? `https://arxiv.org/abs/${json.arxivId}` : ''
    }

    url_doi(json: any) {
        return json.doi ? `https://doi.org/${json.doi}` : ''
    }

    searchline(doc: Paper) {
        const auths = doc.authors.reduce((acc, au) => acc + au.name +  ' ', '')
        const line = [doc.title, auths, doc.venue, doc.year].join(' ').toLowerCase()
        return line //+ ' ' + unidecode(line)
        // NOTE: check gunter
    }

    outbound_names(ref: Paper) {
        const outs = [this.fetchConfig.shortname.toLocaleLowerCase()]
        if (ref.url_arxiv) { outs.push('arxiv') }
        if (ref.url_doi) { outs.push('doi') }
        outs.push('scholar')
        return outs
    }

    doc_authors(json: any): Author[] {
        const toauth = (item) => {
            const auth = new Author()
            auth.name = item.name
            auth.url = item.url
            return auth
        }
        return json.authors.map(toauth)
    }

    reformat_document(json: any, index: number) {
        const newdoc: Paper = new Paper(json.arxivId)

        if (json.title) {
            newdoc.title = remove_title_dates(json.title.trim())
        } else {
            newdoc.title = 'Unknown title'
        }

        newdoc.year = json.year
        newdoc.venue = json.venue
        newdoc.citation_count = json.citation_count
        newdoc.url = json.url || null
        newdoc.doi = json.doi
        newdoc.arxivId = json.arxivId

        newdoc.authors = this.doc_authors(json)
        newdoc.api = this.url_api(json)
        newdoc.url_arxiv = this.url_arxiv(json)
        newdoc.url_doi = this.url_doi(json)

        newdoc.paperId = json.paperId
        newdoc.isInfluential = json.isInfluential || false

        newdoc.simpletitle = remove_puctuation(newdoc.title).toLocaleLowerCase()
        newdoc.searchline = this.searchline(newdoc)
        newdoc.outbound = this.outbound_names(newdoc)
        newdoc.index = index
        return newdoc
    }
}
