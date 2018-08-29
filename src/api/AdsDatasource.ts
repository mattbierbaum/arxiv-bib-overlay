import sourceIcon from '../assets/icon-ads.png'
import sourceLogo from '../assets/source-ads.png'
import { API_ARTICLE_COUNT } from '../bib_config'
import { encodeQueryData, urlproxy } from '../bib_lib'
import { AdsToPaper } from './AdsFromJson'
//import { urlproxy } from '../bib_lib'
import {  BasePaper, DataSource, Paper } from './document'

/** Class to fetch references from ADS. */
export class AdsDatasource implements DataSource {
    ready = {}
    cache: {[key: string]: Paper} = {}
    aid: string 

    data: BasePaper

    icon = sourceIcon
    logo = sourceLogo    

    shortname = 'ADS'
    longname = 'NASA ADS'
    categories = new Set([
        'astro-ph', 'cond-mat', 'gr-qc', 'hep-ex', 'hep-lat',
        'hep-ph', 'hep-th', 'nlin', 'nucl-ex',
        'nucl-th', 'physics', 'quant-ph'
    ])
    
    base_url = 'https://ui.adsabs.harvard.edu'
    homepage = 'https://ui.adsabs.harvard.edu'
    api_url = `${this.base_url}/v1/search/query`
    api_key = '3vgYvCGHUS12SsrgoIfbPhTHcULZCByH8pLODY1x'
    api_params = {
        p: 'a query',
        fl: [
            'id', 'pub', 'bibcode', 'title', 'author', 'bibstem',
            'year', 'doi', 'citation_count', 'read_count', 'identifier'
        ],
        rows: API_ARTICLE_COUNT,
        sort: 'citation_count desc',        
    }
    
    // TODO investigate Sorters, sort_order and sorters_default, these just copied from InspireDatasource
    sorting = {
        sorters: {
            paper: {name: 'Paper order', func: (i) => i.index  },
            citations: {name: 'Citations', func: (i) => i.citation_count},
            influence: {name: 'ADS read count', func: (i) => i.read_count},
            title: {name: 'Title', func: (i) => i.title.toLowerCase() },
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname() },
            year: {name: 'Year', func: (i) => i.year}
        },

    sorters_order: ['citations', 'influence', 'title', 'author', 'year'],
        sorters_default: 'citations'
    }

ads_url_ui = `${this.base_url}/#search/`

json_to_doc = new AdsToPaper(this)

populate( base: BasePaper, citations: Paper[], references: Paper[] ): void {        
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
            sorting: this.sorting
        }
        this.data = output             
    }

fetch_params( query: string, index: number ): string {                
        const params = { ...this.api_params }        
        params.p = query        
        return encodeQueryData(params)
    }
    
    /** Fetch for a query and return a Promise with Object parsed from JSON. */
fetch_docs(query: string, index: number ): Promise < any > {              
        const url = this.api_url + '?' + this.fetch_params(query , index)
        //TODO need          var auth = 'Bearer '+this.api_key;
        // and add that s a request header        
        //xhr.setRequestHeader('Authorization', auth);
        return fetch( urlproxy(url) )
            .then(resp => resp.json())
            .then(json => this.json_to_doc.reformat_documents(json) )
    }   
    
    /** Fetches base, citations and references, then populates this InspireDatasource. */
fetch_all(arxiv_id: string): Promise < AdsDatasource > {
        this.aid = arxiv_id
        return Promise.all(
            [this.fetch_docs(`'arXiv:${arxiv_id}`,  0),
            this.fetch_docs(`citations(arXiv:${arxiv_id})`, 0 ),
            this.fetch_docs(`references(arXiv:${arxiv_id})`, 0 )]
        ).then((results) => {
            const [base, citations, references] = results
            this.populate( base[0], citations, references )          
            return this
        })
    }
    // add_counts(data) {
    //     data.citations.count = data.citation_count
    //     data.references.count = data.references.length
    // }

    // load_data_callback(callback) {
    //     if ('base' in this.ready && 'citations' in this.ready && 'references' in this.ready) {
    //         if (this.rawdata.base.docs.length === 0) {
    //             throw new Error('No data loaded for ' + this.aid)
    //         }

    //         const output = this.reformat_document(this.rawdata.base.docs[0])
    //         output.citations = this.reformat_documents(this.rawdata.citations.docs)
    //         output.references = this.reformat_documents(this.rawdata.references.docs)

    //         output.citations.header = 'Citations'
    //         output.references.header = 'References'
    //         output.citations.header_url = output.url + '/citations'
    //         output.references.header_url = output.url + '/references'
    //         output.citations.description = ''
    //         output.references.description = ''

    //         this.data = output
    //         this.add_counts(this.data)
    //         callback(this)
    //     }
    // }

    // load_data(query, obj, callback) {
    //     this.api_params.q = query

    //     if (obj in this.rawdata) {
    //         this.ready[obj] = true
    //         this.load_data_callback(callback)
    //         return
    //     }

    //     const url = this.api_url + '?' + bib_lib.encodeQueryData(this.api_params)
    //     const auth = 'Bearer ' + this.api_key

    //     $.ajax({
    //         type: 'GET',
    //         async: true,
    //         timeout: bib_config.API_TIMEOUT,
    //         url: bib_lib.urlproxy(url),
    //         beforeSend(xhr) {
    //             xhr.setRequestHeader('Authorization', auth)
    //         },
    //         success: $.proxy(
    //             function(data) {
    //                 this.ready[obj] = true
    //                 this.rawdata[obj] = data.response
    //                 this.load_data_callback(callback)
    //             }, this
    //         ),
    //         error: this.query_error,
    //     })
    // }

    // get_paper(url, callback) {
    //     return callback(this.cache[url])
    // }

    // async_load(callback) {
    //     this.ready = {}
    //     this.aid = bib_lib.get_current_article()
    //     this.load_data('arXiv:' + this.aid, 'base', callback)
    //     this.load_data('citations(arXiv:' + this.aid + ')', 'citations', callback)
    //     this.load_data('references(arXiv:' + this.aid + ')', 'references', callback)
    // }
    
}
    // {return i.index}},
    // citations: {name: 'Citations', func(i) {return i.citation_count}},
    // influence: {name: 'ADS read count', func(i) {return i.read_count}},
    // title: {name: 'Title', func(i) {return i.title.toLowerCase()}},
    // author: {name: 'First author', func(i) {return bib_lib.tolastname(i.authors[0])}},
    // year: {name: 'Year', func(i) {return i.year}}
    //     },
    // sorters_order: ['citations', 'influence', 'title', 'author', 'year'],
    //     sorters_default: 'citations',                                              
    // }
