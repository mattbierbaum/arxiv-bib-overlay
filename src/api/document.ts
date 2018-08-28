
export class Author {
    name: string
    url: string

    tolastname() {
        const name = this.name || ''
        const parts = name.split(' ')
        return parts[ parts.length - 1 ]
    }

}

export class Paper {
    title: string
    authors: Author[]
    year: string
    venue: string
    citation_count: number
    recid: string
    paperId: string
    index: number
    api: string
    url: string
    doi: string
    arxivId?: string 
    url_doi: string
    url_arxiv?: string

    searchline: string
    outbound: string[]    
    
    constructor( arxivId?: string) {
        this.arxivId = arxivId
    }

}

export class PaperGroup {
    documents: Paper[]
    header: string
    header_url: string
    description?: string
    count?: number
}

export class BasePaper extends Paper {
    citations?: PaperGroup
    references?: PaperGroup
}

export interface Sorter {
    name: string
    func(paper: Paper): string | number
}

export interface DataSource {    
    ready: object
    cache: { [key: string]: Paper}
    aid: string
    
    // rawdata: {
    //     base: object
    //     citations: object[]
    //     references: object[]
    // }

    data: BasePaper
    
    /** Logo image, use in TSX like <img src={ds.logo}/> */     
    logo: any

    /** Icon image, use in TSX like <img src={ds.icon}/> */     
    icon: any

    shortname: string
    longname: string 
    categories: Set<string> //= new Set(['hep-th', 'hep-ex', 'hep-ph', 'hep-lat', 'gr-qc'])
    homepage: string

    api_url: string
    api_params: object

    sorters: Map<string, Sorter>        
    sorters_order: string[]
    sorters_default: string    

    fetch_all(arxiv_id: string): Promise<DataSource>
}    
