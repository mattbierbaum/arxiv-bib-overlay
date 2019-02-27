//import * as unidecode from 'unidecode'
import { RE_IDENTIFIER } from '../arxiv_page'
import { encodeQueryData, remove_puctuation } from '../bib_lib'
import { AdsDatasource } from './AdsDatasource'
import { Author, Paper } from './document'

/* Class to convert JSON from Inspire to a Paper. */
export class AdsToPaper {
    fetchConfig: AdsDatasource

    constructor(fetchConfig: AdsDatasource) {
        this.fetchConfig = fetchConfig
    }

    ads_url_part(field: string, value: string) {
        return this.fetchConfig.ads_url_ui + encodeQueryData({q: field + ':"' + value + '"'})
    }
    
    ads_url_author(name: string) {
        return this.ads_url_part('author', name)
    }

    ads_url_title(name: string) {
        return this.ads_url_part('title', name)
    }

    ads_url_bibcode_search(bib: string) {
        return this.ads_url_part('bibcode', bib)
    }

    ads_url_api(bib: string) {
        return `${this.fetchConfig.base_url}/#abs/${bib}`
    }

    ads_url_outbound(bib: string) {
        return `${this.fetchConfig.outbound_url}/#abs/${bib}`
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

    get_eprint(identifiers: string[]) {
        if (!identifiers) { return }
        const firstMatchReducer =  (acc, id) => {
             //once first is found, ignore rest
            if (acc) {
                return acc
             }
            const match = RE_IDENTIFIER.exec(id)
            if (match) {
                return (match[1] || match[2] || match[3])
            }
        }
        return identifiers.reduce(firstMatchReducer, undefined)        
    }

    searchline(doc: Paper) {        
        const auths = doc.authors.reduce((acc, au) => acc + au.name +  ' ', '')
        const line = [doc.title, auths, doc.venue, doc.year].join(' ').toLocaleLowerCase()
        return line // + ' ' + unidecode(line)
    }

    outbound_names(ref: Paper) {
        const outs: string[] = []
        outs.push(this.fetchConfig.shortname.toLowerCase())
        if (ref.url_arxiv) { outs.push('arxiv') }
        if (ref.url_doi) { outs.push('doi') }
        outs.push('scholar')
        return outs
    }

    reformat_document(json: any, index: number): Paper {
        const arxivid = this.get_eprint(json.identifier)
        const newdoc: Paper = new Paper(arxivid)
        newdoc.title = this.reformat_title(json.title)
        newdoc.authors = this.reformat_authors(json.author)
        newdoc.api = this.ads_url_api(json.bibcode)
        newdoc.url = this.ads_url_outbound(json.bibcode)
        newdoc.url_arxiv = this.ads_url_arxiv(json.identifier)
        newdoc.doi = (json.doi || [''])[0]
        newdoc.url_doi = this.ads_url_doi(json)
        newdoc.paperId = json.bincode || ''
        newdoc.year = json.year || ''
        newdoc.venue = json.pub || ''
        newdoc.citation_count = json.citation_count
        newdoc.read_count = json.read_count

        newdoc.simpletitle = remove_puctuation(newdoc.title.toLocaleLowerCase())
        newdoc.searchline = this.searchline(newdoc)
        newdoc.outbound = this.outbound_names(newdoc)
        newdoc.index = index
        return newdoc
    }

    reformat_documents(docs: any) {
        if (!docs || !Array.isArray(docs)) { return [] }

        const output: Paper[] = []
        for (let i = 0; i < docs.length; i++) {
            output.push(this.reformat_document(docs[i], i))
        }
        return output
    }
}
