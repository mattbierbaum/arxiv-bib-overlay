import icon from '../assets/icon-inspire.png'
import sourceLogo from '../assets/source-inspire.png'
import { API_ARTICLE_COUNT } from '../bib_config'
import { encodeQueryData, urlproxy } from '../bib_lib'
import {  BasePaper, DataSource, Paper } from './document'
import { InspireToDoc } from './inspire_to_doc'

export class InspireDatasource implements DataSource {
    ready = {}    
    cache: { [key: string]: Paper} = {}
    aid: string
    
    //JSON objects from Inspire API
    rawdata: {
        base: object
        citations: object[]
        references: object[]
    }

    data: BasePaper
    
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

    sorters = new Map([
        ['paper', {name: 'Paper order', func: (i) => i.index  }],
        ['citations', {name: 'Citations', func: (i) => i.citation_count}],
        ['influence', {name: 'ADS read count', func: (i) => i.read_count}],
        ['title', {name: 'Title', func: (i) => i.title.toLowerCase() }],
        ['author', {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname() }],
        ['year', {name: 'Year', func: (i) => i.year}]
    ])
    
    sorters_order = ['citations', 'influence', 'title', 'author', 'year']
    sorters_default = 'citations'
    
    // t0: "http://inspirehep.net/search?p=hep-th/9711201&of=recjson&ot=recid,number_of_citations,authors,title,year",
    // t1: "http://inspirehep.net/search?p=refersto:recid:451648&of=recjson&rg=250",
    // t2: "http://inspirehep.net/search?p=citedby:recid:451648&of=recjson&rg=250&ot=title,year,authors"

    json_to_doc = new InspireToDoc(this)        
    
    //BDC Candidate for lib?
    url_arxiv(arxivid: string) {
        return arxivid ? 'https://arxiv.org/abs/' + arxivid : null
    }

    url_paper(id: string) {
        return this.homepage + '/record/' + id
    }
    
    url_paper_api(id: string) {
        return this.api_url + '?' + encodeQueryData({p: 'recid:' + id, of: 'recjson'})
    }

    url_author(name: string, recid: number) {
        return this.homepage + '/author/profile/' + name + '?' + encodeQueryData({recid})
    }

    // /** Loads data from this.rawdata into this */
    // load_data_callback(callback: (t: InspireDatasource) => void) {
    //     if ('base' in this.ready && 'citations' in this.ready && 'references' in this.ready) {            
    //         this.populate( this.json_to_doc.reformat_document(this.rawdata.base.docs[0]),
    //                        this.json_to_doc.reformat_documents(this.rawdata.citations.docs),
    //                        this.json_to_doc.reformat_documents(this.rawdata.references.docs))                
    //         callback(this)
    //     }
    // }

    populate( base: BasePaper, citations: Paper[], references: Paper[] ): void {        
        const output = base
        output.citations = {
            documents: citations,
            header: 'Citations',
            header_url: output.url + '/citations',
            description: '',
            count: output.citation_count
        }        
        output.references = {
            documents: references,
            header: 'References',
            header_url: output.url + '/references',
            description: '',
            count: references.length
        }
        this.data = output             
    }

    // load_all(query: string, obj: 'base' | 'citations' | 'references', callback: fetchCallback, index: number, docs) {
    //     const params = { ...this.api_params }
    //     params.p = query
    //     params.jrec = index * this.pagelength
    //     const url = this.api_url + '?' + encodeQueryData(params)        
        
    //     if (obj in this.rawdata) {
    //         this.ready[obj] = true
    //         this.load_data_callback(callback)
    //         return
    //     }

    //     $.ajax({
    //         type: 'GET',
    //         url: urlproxy(url),
    //         dataType: 'text',
    //         async: true,
    //         //timeout: API_TIMEOUT,
    //         //error: this.query_error,
    //         success: (data) => {
    //                 if (data) {
    //                     data = JSON.parse(data)
    //                     /*if (data.length >= this.pagelength){
    //                         this.load_all(query, obj, callback, index+1, $.merge(docs, data))
    //                     } else {*/
    //                     this.ready[obj] = true
    //                     this.rawdata[obj] = {}
    //                     this.rawdata[obj].docs = [].concat(docs, data) //BrianC: was $.merge( docs,data)
    //                     this.load_data_callback(callback)
    //                     //}
    //                 } else {
    //                     this.ready[obj] = true
    //                     this.rawdata[obj] = {}
    //                     this.rawdata[obj].docs = docs
    //                     this.load_data_callback(callback)
    //                 }
    //         }
    //     },     this/*, query, obj, callback, index, docs*/)
    // }

    get_paper(url: string, callback: (t: Paper) => void) {
        return callback(this.cache[url])
    }

    // /* Starts 3 requests to inspire, and joins results in load_data_callback() */
    // async_load(arixv_id: string, callback: fetchCallback) {
    //     this.ready = {}
    //     //this.aid = get_current_article()
    //     this.aid = arixv_id
    //     this.load_all('eprint:' + this.aid, 'base', callback, 0, [])
    //     this.load_all('refersto:eprint:' + this.aid, 'citations', callback, 0, [])
    //     this.load_all('citedby:eprint:' + this.aid, 'references', callback, 0, [])

    // }

    fetch_params( query: string, index: number ): string {
        const params = { ...this.api_params }
        params.p = query
        params.jrec = index * this.pagelength
        return encodeQueryData(params)
    }
    
    /** Fetch for a query and return a Promise with Object parsed from JSON. */
    fetch_docs(query: string, index: number ): Promise<any> {              
        const url = this.api_url + '?' + this.fetch_params( query , index)
        return fetch( urlproxy(url) )
            .then(resp => resp.json())
            .then( json => this.json_to_doc.reformat_documents(json) )
    }   
    
    /** Fetches base, citations and references, then populates this InspireDatasource. */
    fetch_all(arxiv_id: string): Promise<InspireDatasource> {
        this.aid = arxiv_id
        return Promise.all(
            [this.fetch_docs('eprint:' + this.aid,  0),
            this.fetch_docs('refersto:eprint:' + this.aid, 0 ),
            this.fetch_docs('citedby:eprint:' + this.aid, 0 )]
        ).then((results) => {
            const [base, citations, references] = results
            this.populate( base[0], citations, references )          
            return this
        })
    }
}
