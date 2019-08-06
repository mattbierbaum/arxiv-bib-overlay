export const UP: 'up' = 'up'
export const DOWN: 'down' = 'down'

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
    // Items provided directly from the data provider, though they may come in
    // an format that we later convert to our desired format.
    title: string
    authors: Author[]
    year: string
    venue: string
    doi: string | undefined
    arxivId: string | undefined
    citation_count: number

    // Items sometimes constructed, sometimes provided by the data provider
    url: string | undefined // url to paper in external service
    api: string | undefined // url to get more information via external service

    // Computed from other parts of the Paper object
    url_doi?: string
    url_arxiv?: string
    simpletitle: string
    searchline: string
    outbound: string[]
    index: number

    // elements that are specific to a certain datasource, should
    // possibly be subclasses for each ADS, S2...
    isInfluential?: boolean
    read_count?: number
    recid?: string
    paperId?: string

    constructor(arxivId?: string) {
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
    sorters_updown: {[name: string]: 'up' | 'down'}
    sorters_default: string
}

export interface Sorter {
    name: string
    func: (paper: Paper) => string | number
}

export interface DataSource {
    loaded: boolean
    aid: string

    data: BasePaper

    /** Logo image, use in TSX like <img src={ds.logo}/> */
    logo: any

    /** Icon image, use in TSX like <img src={ds.icon}/> */
    icon: any

    /** Maximum number of articles retrieved for any column */
    max_count: number

    email: string
    help: string
    shortname: string
    longname: string
    homepage: string

    categories: Set<string>

    api_url: string
    api_params: object

    sorting: SorterConfig

    fetch_all(arxiv_id: string): Promise<DataSource>
}
