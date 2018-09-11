
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
    index: number
    api: string
    url: string
    doi: string | undefined
    arxivId: string | undefined
    url_doi?: string
    url_arxiv?: string

    // elements that are specific to a certain datasource, should
    // possibly be subclasses for each ADS, S2...
    recid?: string
    paperId?: string

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
    sorting: SorterConfig
}

export class BasePaper extends Paper {
    citations?: PaperGroup
    references?: PaperGroup
}

export interface SorterConfig {
    sorters: {[name: string]: Sorter}
    sorters_order: string[]
    sorters_default: string
}

export interface Sorter {
    name: string
    func: (paper: Paper) => string | number
}

export interface DataSource {    
    cache: { [key: string]: Paper}
    aid: string

    data: BasePaper
    
    /** Logo image, use in TSX like <img src={ds.logo}/> */     
    logo: any

    /** Icon image, use in TSX like <img src={ds.icon}/> */     
    icon: any

    email: string
    shortname: string
    longname: string 
    homepage: string

    categories: Set<string> //= new Set(['hep-th', 'hep-ex', 'hep-ph', 'hep-lat', 'gr-qc'])
        
    api_url: string
    api_params: object

    sorting: SorterConfig

    fetch_all(arxiv_id: string): Promise<DataSource>
}    
