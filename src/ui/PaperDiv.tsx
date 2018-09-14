import * as React from 'react'
import { Paper } from '../api/document'
import { MAX_AUTHORS } from '../bib_config'
import { Outbound, OutboundCite } from './Outbound'

/** Renders a single paper as a citation/reference line. */
export class PaperDiv extends React.Component<{paper: Paper}, {}> {
    render() {
        const paper = this.props.paper
        let auths = paper.authors.map(au => (<a key={au.url} href={au.url} target='_blank'>{au.name}</a>))

        if (auths.length > MAX_AUTHORS) {
            auths = auths.slice(0, MAX_AUTHORS)
            auths.push(<a key={paper.url} href={paper.url} target='_blank'>...</a>)
        }

        return (
            <div className='bib-paper-container'>
              <div className='bib-cite'>
                <OutboundCite paper={this.props.paper}/>
              </div>
              <div className='bib-paper-overhang'>
                <div className='bib-paper'>
                  <a className='notinfluential mathjax' href={paper.url} target='_blank'>{paper.title}</a>
                  <span className='jinfo'>
                    <span className='venue'>{paper.venue}</span>
                    <span className='year'>{paper.year}</span>
                    <span className='citations'>(citations: {paper.citation_count})</span>
                  </span>
                  <div className='bib-authors'>{auths}</div>
                </div>
                <div className='bib-paper-links'>
                  <div className='arrow'></div>
                  <span>View article:</span>
                  <Outbound paper={this.props.paper}/>
                </div>
            </div>
          </div>
        )
  }
}
