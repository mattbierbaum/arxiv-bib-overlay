import { encodeQueryData, remove_puctuation } from '../bib_lib'
import { Author, Paper } from './document'
import { InspireDatasource } from './InspireDatasource'

/* Class to convert JSON from Inspire to a Paper.  */
export class InspireToPaper {
    fetchConfig: InspireDatasource

    constructor(fetch_config: InspireDatasource) {
        this.fetchConfig = fetch_config
    }

    reverse_name(name: string) {
        if (name.indexOf(',') < 0) {
            return name
        }

        return name.split(', ').map((i) => i.trim()).reverse().join(' ')
    }

    //BDC Candidate for lib?
    url_arxiv(arxivid: string) {
        return arxivid ? 'https://arxiv.org/abs/' + arxivid : undefined
    }

    url_author(id: string) {
        return this.fetchConfig.url_author + '/' + id
    }

    url_paper(id: string) {
        return this.fetchConfig.url_paper + '/' + id
    }

    url_paper_api(id: string) {
        return this.fetchConfig.api_url + '?' + encodeQueryData({q: `recid:${id}`})
    }

    //BDC Candidate for lib?
    string_to_array(e: string|string[]): string[] {
        if (typeof e === 'string') {
            return [e]
        }
        return e
    }

    searchline(json: any) {
        const auths = json.authors.reduce((acc, au) => acc + au.name +  ' ', '')
        return [json.title, auths, json.venue, json.year].join(' ').toLowerCase()
    }

    outbound_names(ref: Paper) {
        const outs = [this.fetchConfig.shortname.toLocaleLowerCase()]
        if (ref.url_arxiv) { outs.push('arxiv') }
        if (ref.url_doi) { outs.push('doi') }
        outs.push('scholar')
        return outs
    }

    meta_arxiv_id(json: any) {
        const eprints = json.arxiv_eprint || json.arxiv_eprints

        if (eprints && eprints.length > 1) {
            console.log(eprints)
        }

        if (eprints && eprints.length > 0) {
            return eprints[0].value
        }
    }

    meta_title(json: any) {
        // get the arxiv title, or the first encountered title in the records
        const titles = json.titles

        if (!titles) { return '' }

        let tmp_title = ''
        for (const title of titles) {
            if (title.source === 'arXiv') {
                return title.title
            } else {
                tmp_title = tmp_title ? tmp_title : title.title
            }
        }

        return tmp_title
    }

    meta_authors(json: any) {
        const authors = json.authors

        if (authors === undefined) { return [] }

        const to_auth = (item) => {
            const au = new Author()
            const link = item.record ? item.record.$ref.replace('api/', '') : ''
            au.name = this.reverse_name(item.full_name)
            au.url = link ? link : this.url_author(item.recid)
            return au
        }

        return authors.map(to_auth)
    }

    meta_year(json: any) {
        if (json.preprint_date) {
            return json.preprint_date.substring(0, 4)
        }

        const pub = json.publication_info
        if (pub && pub.length > 0) {
            const p = pub[0]
            if (p.pubinfo_freetext) {
                const re = /\d\d\d\d/
                if (re.test(p.pubinfo_freetext)) {
                    const matches = re.exec(p.pubinfo_freetext)
                    if (matches && matches.length > 0) {
                        return matches[0]
                    }
                }
            }
            if (p.year) {
                return p.year.toString()
            }
        }

        if (json.legacy_creation_date) {
            return json.legacy_creation_date.substring(0, 4)
        }

        return ''
    }

    meta_venue(json: any) {
        const pub = json.publication_info
        if (pub && pub.length > 0) {
            const name = pub[0].journal_title
            if (name) {
                return name.replace(/\.([^ ])/g, '. $1')
            }
        }
    }

    meta_doi(json: any) {
        const dois = json.dois

        if (dois && dois.length > 0) {
            return dois[0].value
        }
        return ''
    }

    meta_recid(json: any) { return json.control_number.toString() }

    json_search_to_meta(json: any) {
        // used to extract the metadata section from a paper search /literature?q=
        if (json.hits.total === 0) {
            return
        }

        return json.hits.hits[0].metadata
    }

    json_search_to_metas(json: any) {
        if (json.hits.total === 0) {
            return
        }

        return json.hits.hits.map((i) => i.metadata)
    }

    json_references_to_papers(json: any): Paper[] {
        const refs = json.metadata.references
        return this.reformat_documents(refs)
    }

    json_citations_to_papers(json: any): Paper[] {
        const cites = json.metadata.citations
        return this.reformat_documents(cites)
    }

    json_refersto_to_papers(json: any): Paper[] {
        console.log(json)
        const refs = this.json_search_to_metas(json)
        return this.reformat_documents(refs)
    }

    metadata_to_paper(json: any, index: number): Paper | undefined {
        if (!json.control_number) {return}

        const arxivid = this.meta_arxiv_id(json)
        const recid = this.meta_recid(json)
        const paper: Paper = new Paper(arxivid)

        paper.title = this.meta_title(json)
        paper.authors = this.meta_authors(json)
        paper.year = this.meta_year(json)
        paper.venue = this.meta_venue(json)
        paper.citation_count = json.citation_count
        paper.recid = recid
        paper.paperId = recid
        paper.index = index

        paper.api = this.url_paper_api(recid)
        paper.url = this.url_paper(recid)
        paper.arxivId = arxivid
        paper.doi = this.meta_doi(json)
        paper.url_doi = paper.doi ? 'https://doi.org/' + paper.doi : ''
        paper.url_arxiv = this.url_arxiv(arxivid)

        paper.simpletitle = remove_puctuation(paper.title.toLocaleLowerCase())
        paper.searchline = this.searchline(paper)
        paper.outbound = this.outbound_names(paper)
        return paper
    }

    reformat_documents(jsons: any): Paper[] {
        if (!jsons) { return [] }

        const output: Paper[] = []
        for (let i = 0; i < jsons.length; i++) {
            const d = this.metadata_to_paper(jsons[i], i)
            if (d !== undefined) {
                output.push(d)
            }
        }
        return output
    }

    reformat_search_results(jsons: any): Paper[] {
        if (!jsons) { return [] }

        const output: Paper[] = []
        for (let i = 0; i < jsons.length; i++) {
            const d = this.metadata_to_paper(jsons[i], i)
            if (d !== undefined) {
                output.push(d)
            }
        }
        return output
    }
}
