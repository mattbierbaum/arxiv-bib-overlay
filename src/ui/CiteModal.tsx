import { observable } from 'mobx'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import '../App.css'
import { Paper } from '../api/document'
import { API_ARXIV_METADATA, API_CROSSREF_CITE } from '../bib_config'

export class CiteModal extends React.Component<{ paper: Paper }, {}> {
    @observable
    source: 'arxiv' | 'doi' = 'arxiv'

    @observable
    format: 'bibtex' | 'mla' = 'bibtex'

    @observable
    content: number

    format_mla_doi(data) {
        data = data.replace('Crossref. Web.', '')
        return data
    }

    format_bibtex_doi(data) {
        data = data.replace(/^\s+/, '')
        data = data.replace(/},/g, '},\n  ')
        data = data.replace(', title=', ',\n   title=')
        data = data.replace('}}', '}\n}')
        return data
    }

    query_arxiv() {
        const url: string = API_ARXIV_METADATA + this.props.paper.arxivId
        return url
    }

    query_doi() {
        const url: string = API_CROSSREF_CITE + this.props.paper.doi
        return url
        /*$.ajax({
            type: 'GET',
            async: true,
            dataType: 'text',
            timeout: bib_config.API_TIMEOUT,
            url: bib_lib.urlproxy(url),
            beforeSend: $.proxy(function(xhr){
                xhr.setRequestHeader('Accept', 'text/bibliography; style='+this.typ);
            }, this),
            success: $.proxy(function(data){
                data = this.format_bibtex_doi(data);
                data = this.format_mla_doi(data);
                this.display_content(data);
            }, this)
        });*/
    }

    public render() {
        const paper = this.props.paper

        if (!paper.doi && !paper.arxivId)
            return

        return (
    	    <div className='modal'>
                <div className='modal-content'>
                    <div className='modal-title'>
                        <h2>Export formatted citation</h2>
                        <span className='modal-close'>&times;</span>
                    </div>
                    <div className='modal-buttons'>
                        <div className='modal-button-group'>
                            <h4>Article to reference:</h4>
                            <input id="arxiv" type="radio" name="article" value="arxiv"/>
                            <label htmlFor="arxiv">arXiv e-print</label> <br/>
                            <input id="doi" type="radio" name="article" value="doi" />
                            <label htmlFor="doi">Journal article</label> <br/>
                        </div>
                        <div className='modal-button-group'>
                            <h4>Reference format:</h4>
                            <input id="bibtex" type="radio" name="format" value="bibtex"/>
                            <label htmlFor="bibtex">BibTeX</label> <br/>
                            <input id="mla" type="radio" name="format" value="mla"/>
                            <label htmlFor="mla">MLA</label> <br/>
                        </div>
                    </div>
                    <div>
                        <h4>Formatted citation:</h4>
                        <textarea value={this.content}></textarea>
                    </div>
                </div>
            </div>
        )
    }
}

export function cite_modal(paper: Paper) {
    ReactDOM.render(<CiteModal paper={paper} />, document.getElementById('modal'));
}
