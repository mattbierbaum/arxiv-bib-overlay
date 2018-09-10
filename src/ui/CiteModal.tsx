import { observable } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as xmldom from 'xmldom'
import * as xpath from 'xpath'
import { Paper } from '../api/document'
import '../App.css'
import { API_ARXIV_METADATA, API_CROSSREF_CITE } from '../bib_config'

@observer
export class CiteModal extends React.Component<{ paper: Paper }, {}> {
    @observable
    active: boolean = true

    @observable
    source: 'arxiv' | 'doi' = 'arxiv'

    @observable
    format: 'bibtex' | 'mla' = 'bibtex'

    @observable
    content: string

    constructor(props: any) {
        super(props)

        if (!this.props.paper.arxivId) {
            this.source = 'doi'
        }

        this.active = true
        this.query()
    }

    format_bibtex_arxiv(data: string) {
        const parser = new xmldom.DOMParser()
        const xml = parser.parseFromString(data, 'text/xml')
        const select = xpath.useNamespaces({atom: 'http://www.w3.org/2005/Atom'})

        const title = select('string(//atom:entry/atom:title/text())', xml)
        const auths = select('//atom:entry/atom:author/atom:name/text()', xml)
        const year = select('//atom:entry/atom:published/text()', xml)

        const txt_title = title.toString().replace('\n', '')
        const txt_auths = auths.map((i) => i.toString()).join(' and ')
        const txt_year = year.toString().split('-')[0]

        const id_auths = txt_auths.split(' ')[0].toLocaleLowerCase()
        const id_title = txt_title.split(' ')[0].toLocaleLowerCase()
        const txt_id = `${id_auths}${txt_year}${id_title}`.replace(/[^a-z0-9]/gmi, '')

        const output = 
`@article{${txt_id},
    title={${txt_title}},
    author={${txt_auths}},
    year={${txt_year}},
    eprint={${this.props.paper.arxivId}},
    archivePrefix={arXiv}
}`
        return output
    }

    format_mla_doi(data: string) {
        data = data.replace('Crossref. Web.', '')
        return data
    }

    format_bibtex_doi(data: string) {
        data = data.replace(/^\s+/, '')
        data = data.replace(/},/g, '},\n  ')
        data = data.replace(', title=', ',\n   title=')
        data = data.replace('}}', '}\n}')
        return data
    }

    query_arxiv() {
        const url: string = API_ARXIV_METADATA + this.props.paper.arxivId
        fetch(url)
            .then(resp => resp.text())
            .then(txt => {
                this.content = this.format_bibtex_arxiv(txt)
            })
    }

    query_doi() {
        const url: string = API_CROSSREF_CITE + this.props.paper.doi
        const headers = {headers: {Accept: `text/bibliography; style=${this.format}`}}

        fetch(url, headers)
            .then(resp => resp.text())
            .then(txt => {
                this.content = this.format_bibtex_doi(txt)
            })
    }

    query() {
        if (this.source === 'arxiv') {
            this.query_arxiv()
        } else {
            this.query_doi()
        }
    }

    change_source(event: any) {
        this.source = event.target.value

        if (this.source === 'arxiv') {
            this.format = 'bibtex'
        }
        this.query()
    }

    change_format(event: any) {
        this.format = event.target.value
        this.query()
    }

    public render() {
        const paper = this.props.paper

        if (!this.active || (!paper.doi && !paper.arxivId)) {
            return null
        }

        const hasarxiv = !(paper.arxivId == null)
        const hasmla = !(this.source === 'arxiv')

        return (
            <div className='modal'>
                <div className='modal-content'>
                    <div className='modal-title'>
                        <h2>Export formatted citation</h2>
                        <span className='modal-close' onClick={() => {this.active = false}}>&times;</span>
                    </div>
                    <div className='modal-buttons'>
                        <div className='modal-button-group'>
                            <h4>Article to reference:</h4>
                            <input id='arxiv' type='radio' name='article' value='arxiv'
                                checked={this.source === 'arxiv'}
                                onChange={this.change_source.bind(this)}
                                disabled={!hasarxiv}
                            />
                            <label htmlFor='arxiv' className={hasarxiv ? '' : 'disabled'}>arXiv e-print</label> <br/>
                            <input id='doi' type='radio' name='article' value='doi'
                                checked={this.source === 'doi'}
                                onChange={this.change_source.bind(this)}
                            />
                            <label htmlFor='doi'>Journal article</label> <br/>
                        </div>
                        <div className='modal-button-group'>
                            <h4>Reference format:</h4>
                            <input id='bibtex' type='radio' name='format' value='bibtex'
                                checked={this.format === 'bibtex'}
                                onChange={this.change_format.bind(this)}
                            />
                            <label htmlFor='bibtex'>BibTeX</label> <br/>
                            <input id='mla' type='radio' name='format' value='mla'
                                checked={this.format === 'mla'}
                                onChange={this.change_format.bind(this)}
                                disabled={!hasmla}
                            />
                            <label htmlFor='mla' className={hasmla ? '' : 'disabled'}>MLA</label> <br/>
                        </div>
                    </div>
                    <div>
                        <h4>Formatted citation:</h4>
                        <textarea rows={15} cols={75} value={this.content}></textarea>
                    </div>
                </div>
            </div>
        )
    }
}

export function cite_modal(paper: Paper) {
    ReactDOM.render(<CiteModal paper={paper} key={paper.api} />, document.getElementById('modal'))
}
