import * as React from 'react'
import { Paper } from '../api/document'

/** Renders outbound links for a paper. */
export class Outbound extends React.Component<{paper: Paper}, {}> {
    render() {
        // TODO not impelemented 
        // This is just place holder example html
        return (
        <div className = 'bib-outbound' >
            <span className='exitarrow movearrow'>↳ </span>

            <span><a className='inspire' title='Inspire HEP' 
                href='https://inspirehep.net/record/110328' target='_blank'>
            <img src='/bib-overlay/static/icon-inspire.png'/></a></span>

            <span><a className='doi' title='Journal article'
                    href='https://doi.org/10.1103/PhysRevD.15.2752' target='_blank'>
            <img src='/bib-overlay/static/icon-doi.png' /></a></span>

            <span><a className='scholar' title='Google Scholar'
                    href='https://scholar.google.com/scholar?q=blablalba'>
            <img src='/bib-overlay/static/icon-scholar.png' /></a></span>

            <span><a className='cite' title='Citation entry'>
            <img src='/bib-overlay/static/icon-cite.png' /></a></span>
        </div>
        )
    }
}