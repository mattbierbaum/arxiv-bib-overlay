
export class Author {
    name: string
    url: string

    tolastname() {
        const name = this.name || ''
        const parts = name.split(' ')
        return parts[ parts.length - 1 ]
    }

}

export class Document {
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
    arxivId: string
    url_doi: string
    url_arxiv: string | null

    searchline: string
    outbound: string[]

    constructor( arxivId: string) {
        this.arxivId = arxivId
    }

}

export class DocumentGroup {
    documents: Document[]
    header: string
    header_url: string
    description?: string
    count?: number
}

export class BaseDocument extends Document {
    citations?: DocumentGroup
    references?: DocumentGroup
}
