import * as React from 'react'
import { Paper } from '../api/document'
import { Outbound } from './Outbound'

/** Renders a single paper as a citation/reference line. */
export class PaperDiv extends React.Component<{paper: Paper}, {}> {
  render() {
    const paper = this.props.paper
    return (
        <div className='bib-paper'>
          <a className='notinfluential mathjax' href={paper.url}>{paper.title}</a>
          <span className='jinfo'>
            <span className='venue'>{paper.venue}</span>
            <span className='year'>{paper.year}</span>
            <span className='citations'>(citations: {paper.citation_count})</span>
          </span>
          <div className='bib-authors'>
            { paper.authors.map( au => (<a key={au.url} href={au.url}>{au.name}</a>))}            
          </div>
          <Outbound paper={this.props.paper}/>
        </div>
    )    
  }
}
