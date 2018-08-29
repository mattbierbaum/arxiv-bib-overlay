import * as React from 'react'
import { Paper } from '../api/document'
import adsIcon from '../assets/icon-ads.png'
import arxivIcon from '../assets/icon-arxiv.png'
import citeIcon from '../assets/icon-cite.png'
import doiIcon from '../assets/icon-doi.png'
import inspireIcon from '../assets/icon-inspire.png'
import s2Icon from '../assets/icon-s2.png'
import scholarIcon from '../assets/icon-scholar.png'
import { API_SCHOLAR_SEARCH } from '../bib_config'
import { encodeQueryData } from '../bib_lib'

const _link = ( name: string, desc: string, url: string|undefined, icon: any) => 
    ! url ? null : (<span key={name + url}><a className={name} title={desc} href={url}><img src={icon}/></a></span>)

const _modal = ( name: string, desc: string, doi: string, arxivId: string | undefined, icon: any) =>
    ! arxivId ? null : (<span key={name + arxivId}>
    <a className={name} title={desc} href='TODO:implement model'><img src={icon}/></a></span>)

/** Renders list of outbound links for a paper. */
export class Outbound extends React.Component<{paper: Paper}, {}> {
    
    make_link = {
        ads(ref: Paper) {return _link('ads', 'NASA ADS', ref.url, adsIcon )},
        s2(ref: Paper) {return _link('s2', 'Semantic Scholar', ref.url, s2Icon)},
        inspire(ref: Paper) {return _link('inspire', 'Inspire HEP', ref.url, inspireIcon)},
        arxiv(ref: Paper) {return _link('arxiv', 'ArXiv article', ref.url_arxiv, arxivIcon)},
        doi(ref: Paper) {return _link('doi', 'Journal article', ref.url_doi, doiIcon)},
        cite(ref: Paper) {return _modal('cite', 'Citation entry', ref.doi, ref.arxivId, citeIcon)},
        scholar(ref: Paper) {
            return _link( 'scholar', 'Google Scholar',
                          API_SCHOLAR_SEARCH + '?' + encodeQueryData({q: ref.title}), scholarIcon)},
    }
    
    render() {
        const ref = this.props.paper
        const outbounds: JSX.Element[] = ref.outbound.map( ob_style  => this.make_link[ob_style](ref) )

        return(
            <div className = 'bib-outbound' >
                <span className='exitarrow movearrow'>↳ </span>
                {outbounds}
            </div>            
        )
    }   
}
