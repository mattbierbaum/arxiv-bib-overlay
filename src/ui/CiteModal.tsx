import { observable } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as xmldom from 'xmldom'
import * as xpath from 'xpath'
import { Paper } from '../api/document'
import '../App.css'
import { pageElementModal } from '../arxiv_page'
import { API_ARXIV_METADATA, API_CROSSREF_CITE } from '../bib_config'
import { normalize_whitespace } from '../bib_lib'

// FIXME -- add https://crosscite.org/

const provider_desc = {
    arxiv: 'arXiv API',
    doi: 'Crossref Citation Format'
}

const provider_url = {
    arxiv: 'https://arxiv.org/help/api/index',
    doi: 'https://www.crossref.org/labs/citation-formatting-service/'
}

const STOPWORDS = new Set(['a', 'about', 'above', 'above', 'across', 'after',
    'afterwards', 'again', 'against', 'all', 'almost', 'alone', 'along',
    'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'amoungst',
    'amount',  'an', 'and', 'another',
    'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'are', 'around',
    'as',  'at', 'back', 'be', 'became', 'because', 'become', 'becomes',
    'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'below',
    'beside', 'besides', 'between', 'beyond', 'bill', 'both', 'bottom', 'but',
    'by', 'call', 'can', 'cannot', 'cant', 'co', 'con', 'could', 'couldnt',
    'cry', 'de', 'describe', 'detail', 'do', 'done', 'down', 'due', 'during',
    'each', 'eg', 'eight', 'either', 'eleven', 'else', 'elsewhere', 'empty',
    'enough', 'etc', 'even', 'ever', 'every', 'everyone', 'everything',
    'everywhere', 'except', 'few', 'fifteen', 'fify', 'fill', 'find', 'fire',
    'first', 'five', 'for', 'former', 'formerly', 'forty', 'found', 'four',
    'from', 'front', 'full', 'further', 'get', 'give', 'go', 'had', 'has',
    'hasnt', 'have', 'he', 'hence', 'her', 'here', 'hereafter', 'hereby',
    'herein', 'hereupon', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'however', 'hundred', 'ie', 'if', 'in', 'inc', 'indeed', 'interest',
    'into', 'is', 'it', 'its', 'itself', 'keep', 'last', 'latter', 'latterly',
    'least', 'less', 'ltd', 'made', 'many', 'may', 'me', 'meanwhile', 'might',
    'mill', 'mine', 'more', 'moreover', 'most', 'mostly', 'move', 'much',
    'must', 'my', 'myself', 'name', 'namely', 'neither', 'never',
    'nevertheless', 'next', 'nine', 'no', 'nobody', 'none', 'noone', 'nor',
    'not', 'nothing', 'now', 'nowhere', 'of', 'off', 'often', 'on', 'once',
    'one', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'part', 'per', 'perhaps', 'please',
    'put', 'rather', 're', 'same', 'see', 'seem', 'seemed', 'seeming', 'seems',
    'serious', 'several', 'she', 'should', 'show', 'side', 'since', 'sincere',
    'six', 'sixty', 'so', 'some', 'somehow', 'someone', 'something',
    'sometime', 'sometimes', 'somewhere', 'still', 'such', 'system', 'take',
    'ten', 'than', 'that', 'the', 'their', 'them', 'themselves', 'then',
    'thence', 'there', 'thereafter', 'thereby', 'therefore', 'therein',
    'thereupon', 'these', 'they', 'thickv', 'thin', 'third', 'this', 'those',
    'though', 'three', 'through', 'throughout', 'thru', 'thus', 'to',
    'together', 'too', 'top', 'toward', 'towards', 'twelve', 'twenty', 'two',
    'un', 'under', 'until', 'up', 'upon', 'us', 'very', 'via', 'was', 'we',
    'well', 'were', 'what', 'whatever', 'when', 'whence', 'whenever', 'where',
    'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever',
    'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole', 'whom',
    'whose', 'why', 'will', 'with', 'within', 'without', 'would', 'yet', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'the'])

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

    chars_only(data: string): string {
        return data.replace(/[^a-z0-9 ]/gmi, '')
    }

    fmt_first_last_name(data: string) {
        const name = this.chars_only(data).split('and')
        if (name.length <= 0) {
            return 'unknown'
        }

        const parts = name[0].trim().split(' ')
        if (parts.length <= 0) {
            return 'unknown'
        }

        return parts[parts.length - 1]
    }

    fmt_first_nonstop(data: string) {
        const words = this.chars_only(data).split(' ')
        if (words.length <= 0) {
            return 'unknown'
        }

        for (const word of words) {
            if (!STOPWORDS.has(word.toLocaleLowerCase())) {
                return word
            }
        }
        return 'unknown'
    }

    format_bibtex_arxiv(data: string) {
        const parser = new xmldom.DOMParser()
        const xml = parser.parseFromString(data, 'text/xml')
        const select = xpath.useNamespaces({
            atom: 'http://www.w3.org/2005/Atom',
            arxiv: 'http://arxiv.org/schemas/atom'
        })

        const title = select('string(//atom:entry/atom:title/text())', xml)
        const auths = select('//atom:entry/atom:author/atom:name/text()', xml)
        const year = select('//atom:entry/atom:published/text()', xml)
        const primary = select('string(//atom:entry/arxiv:primary_category/@term)', xml)

        const txt_title = normalize_whitespace(title.toString())
        const txt_auths = auths.map((i) => i.toString()).join(' and ')
        const txt_year = year.toString().split('-')[0]

        const id_auths = this.fmt_first_last_name(txt_auths).toLocaleLowerCase()
        const id_title = this.fmt_first_nonstop(txt_title).toLocaleLowerCase()
        const txt_id = this.chars_only(`${id_auths}${txt_year}${id_title}`)

        const output = 
`@article{${txt_id},
    title={${txt_title}},
    author={${txt_auths}},
    year={${txt_year}},
    eprint={${this.props.paper.arxivId}},
    archivePrefix={arXiv},
    primaryClass={${primary}}
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
        const hasdoi = !(paper.doi == null || paper.doi === '')
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
                                disabled={!hasdoi}
                            />
                            <label htmlFor='doi' className={hasdoi ? '' : 'disabled'}>Journal article</label> <br/>
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
                    <div>
                        <span>Data provided by: </span>
                        <a href={provider_url[this.source]}>{provider_desc[this.source]}</a>
                    </div>
                </div>
            </div>
        )
    }
}

export function cite_modal(paper: Paper) {
    ReactDOM.render(
        <CiteModal paper={paper} key={paper.api} />,
        pageElementModal()
    )
}
