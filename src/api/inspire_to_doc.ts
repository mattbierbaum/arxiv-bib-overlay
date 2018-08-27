import { RE_IDENTIFIER } from '../arxiv_page'
import { Author, Paper } from './document'
import { InspireDatasource } from './inspire_fetch'

/* Class to convert JSON from Inspire to a Document.  */
export class InspireToDoc {
    fetchConfig: InspireDatasource
    
    constructor(fetch_config: InspireDatasource) {
        this.fetchConfig = fetch_config
    }

    //BDC Candidate for lib?
    string_to_array(e: string|string[]): string[] {        
        if (typeof e === 'string') {
            return [e]
        }
        return e
    }

    doc_arxiv_id(json: any) {
        let match
        const reports = json.primary_report_number
        if (reports && typeof reports === 'string') {
            match = RE_IDENTIFIER.exec(reports)
            if (match) { return (match[1] || match[2]) }
        } else if (reports) {            
            for ( const report of reports) {
                match = RE_IDENTIFIER.exec(report)
                if (match) { return (match[1] || match[2]) }
            }
        }
    }

    doc_year(json: any) {        
        if (json.publication_info && json.publication_info.year) {
            return json.publication_info.year
        }

        if (json.cataloguer_info && json.cataloguer_info.length > 0) {
            return json.cataloguer_info[0].creation_date.substring(0, 4)
        }

        if (json.prepublication && json.prepublication.date) {
            return json.prepublication.date.substring(0, 4)
        }

        if (json.creation_date) {
            return json.creation_date.substring(0, 4)
        } else {            
            return ''
        }
    }

    doc_title(json: any) {        
        if (!json.title || !json.title.title) { return '' }
        return json.title.title
    }

    doc_authors(json: any): Author[] {
        if (!json.authors) { return [] }

        const toAuth = (item) => {
            const name = [item.first_name, item.last_name].join(' ')
            const url = this.fetchConfig.url_author(item.full_name, json.recid)
            return {name, url, }
        }
        return json.authors.map(toAuth)            
    }

    doc_venue(json: any) {        
        const pubs = json.publication_info
        if (!pubs || ! Array.isArray( pubs )) { return '' }
        const pubsWt = pubs.find( pub => pub.title )
        if ( pubsWt ) {
            return pubsWt.title.split('.').join(' ')            
        } else {
            return ''
        }
    }

    searchline(json: any) {        
        const auths = json.authors.join(' ')
        return [json.title, auths, json.venue, json.year].join(' ').toLowerCase()
    }

    outbound_names(ref: Paper) {        
        const outs = [this.fetchConfig.shortname.toLocaleLowerCase()]
        if (ref.url_arxiv) { outs.push('arxiv') }
        if (ref.url_doi) { outs.push('doi') }
        outs.push('scholar')
        if (ref.doi || ref.arxivId) { outs.push('cite') }
        return outs
    }

    /* Convert an object from JSON to a Document.
       This will throw exceptions if the JSON is not as expected */
    reformat_document(json: any, index: number) {
        const arxivid = this.doc_arxiv_id(json)
        const newdoc: Paper = new Paper(arxivid)
        
        newdoc.title = this.doc_title(json)
        newdoc.authors = this.doc_authors(json)
        newdoc.year = this.doc_year(json)
        newdoc.venue = this.doc_venue(json)
        newdoc.citation_count = json.number_of_citations
        newdoc.recid = json.recid.toString()
        newdoc.paperId = json.recid.toString()
        newdoc.index = index
        newdoc.api = this.fetchConfig.url_paper_api(json.recid.toString())
        newdoc.url = this.fetchConfig.url_paper(json.recid)
        newdoc.doi = this.string_to_array(json.doi || '')[0]
        newdoc.arxivId = arxivid
        newdoc.url_doi = json.doi ? 'https://doi.org/' + json.doi : ''
        newdoc.url_arxiv = this.fetchConfig.url_arxiv(arxivid)
        newdoc.searchline = this.searchline(newdoc)
        newdoc.outbound = this.outbound_names(newdoc)
        return newdoc
    }

    reformat_documents(jsons: any): Paper[] {        
        if (!jsons) { return [] }
        
        const output: Paper[] = []
        for (let i = 0; i < jsons.length; i++) {
            const d = this.reformat_document(jsons[i], i)
            this.fetchConfig.cache[d.api] = d
            output.push(d)
        }        
        return output
    }
}
