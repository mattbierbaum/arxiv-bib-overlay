import { RE_IDENTIFIER } from '../arxiv_page'
import { encodeQueryData } from '../bib_lib'
import { AdsDatasource } from './AdsDatasource'
import { Author, Paper } from './document'

/* Class to convert JSON from Inspire to a Paper. */
export class AdsToPaper {
    fetchConfig: AdsDatasource

    constructor( fetchConfig: AdsDatasource) {
        this.fetchConfig = fetchConfig
    }

    ads_url_part(field: string, value: string) {
        return this.fetchConfig.ads_url_ui + encodeQueryData({q: field + ':"' + value + '"'})
    }
    
    ads_url_author(name: string) {return this.ads_url_part('author', name)}

    ads_url_title(name: string) {return this.ads_url_part('title', name)}

    ads_url_bibcode_search(bib: string) {return this.ads_url_part('bibcode', bib)}

    ads_url_bibcode(bib: string) {
        return `${this.fetchConfig.base_url}/#abs/${bib}`        
    }

    ads_url_arxiv(identifiers: string[]) {
        const eprint = this.get_eprint(identifiers)
        if (eprint) {
            return 'https://arxiv.org/abs/' + eprint
        }
        return
    }

    reverse_author(name: string) {
        if (!name) { return 'Unknown' }
        return name.split(', ').reverse().join(' ')
    }

    reformat_authors(auths: any): Author[] {
        if (!auths) { return [] }        
        return auths.map((item) => {
            const au = new Author()
            au.name = this.reverse_author(item)
            au.url = this.ads_url_author(item)            
            return au
        })
    }

    reformat_title(title: any) {
        if (!title || title.length === 0) {
            return 'Unknown'
        }
        return title[0]
    }
    
    ads_url_doi(doc: any) {
        if (!doc.doi) { return '' }
        //TODO what is bibcode?
        return this.fetchConfig.homepage + '/link_gateway/' + doc.bibcode + '/doi:' + doc.doi
    }

    /*
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
    }*/

    get_eprint(identifiers: string[]) {
        if (!identifiers) { return }
        const firstMatchReducer =  (acc, id) => {
            if ( acc ) { return acc } //once first is found, ignore rest
            const match = RE_IDENTIFIER.exec(id)
            if (match) { return (match[1] || match[2] || match[3]) }
        }
        return identifiers.reduce(firstMatchReducer, undefined)        
    }

    searchline(doc: Paper) {        
        const auths = doc.authors.reduce( (acc, au) => acc + au.name +  ' ', '' )
        return [doc.title, auths, doc.venue, doc.year].join(' ').toLowerCase()
    }

    outbound_names(ref: Paper) {
        const outs: string[] = []
        outs.push(this.fetchConfig.shortname.toLowerCase())
        if (ref.url_arxiv) { outs.push('arxiv') }
        if (ref.url_doi) { outs.push('doi') }
        outs.push('scholar')
        if (ref.doi || ref.arxivId) { outs.push('cite') }
        return outs
    }

    reformat_document(json: any, index: number): Paper {
        const arxivid = this.get_eprint(json.identifier)
        const newdoc: Paper = new Paper(arxivid)
        newdoc.title = this.reformat_title(json.title)
        newdoc.authors = this.reformat_authors(json.author)
        newdoc.api = this.ads_url_bibcode(json.bibcode)
        newdoc.url = newdoc.api
        newdoc.url_arxiv = this.ads_url_arxiv(json.identifier)
        newdoc.doi = (json.doi || [''])[0]
        newdoc.paperId = json.bincode || ''
        newdoc.year = json.year || ''
        newdoc.venue = json.pub || ''
        //newdoc.identifier = json.identifier || ''
        newdoc.citation_count = json.citation_count

        // const newdoc = {
        //     title: this.reformat_title(json.title),
        //     authors: this.reformat_authors(json.author),
        //     api: this.ads_url_bibcode(json.bibcode),
        //     url: this.ads_url_bibcode(json.bibcode),
        //     url_arxiv: this.ads_url_arxiv(json.identifier),
        //     url_doi: this.ads_url_doi(json),
        //     arxivId: this.get_eprint(json.identifier),
        //     doi: (json.doi || [''])[0],
        //     paperId: json.bibcode || '',
        //     year: json.year || '',
        //     venue: json.pub || '',
        //     identifier: json.identifier || '',
        //     citation_count: json.citation_count,
        //     read_count: json.read_count,
        //     index,
        // }
        newdoc.searchline = this.searchline(newdoc)
        newdoc.outbound = this.outbound_names(newdoc)
        return newdoc
    }

    reformat_documents(docs: any) {
        if (!docs || !Array.isArray(docs)) { return [] }

        const output: Paper[] = []
        for (let i = 0; i < docs.length; i++) {
            const d = this.reformat_document(docs[i], i)
            //this.cache[d.api] = d
            output.push(d)
        }
        return output
    }

}
    