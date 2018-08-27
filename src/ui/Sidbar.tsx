import { observer } from 'mobx-react'
import * as React from 'react'
import { BibModel } from '../model/BibModel'

@observer
export class Sidebar extends React.Component<{ bibModel: BibModel}, {}> {
    public render() {        
        
        if ( ! this.props.bibModel || 
            ! this.props.bibModel.paper ||
            ! this.props.bibModel.paper.authors
        ) {
            return <div/>
        }
        const au_lis = this.props.bibModel.paper.authors.map(
            au => <li><a href={au.url} target='_blank'>{au.name}</a></li>)
        
        return (
        <div className='delete bib-sidebar'>          
          <div className='bib-sidebar-paper' >
            <h3>Citations for authors</h3>
            <ul className='bib-sidebar-authors'>
              {au_lis}
            </ul>
            
            <div className='bib-outbound'>
              <span className='exitarrow movearrow'>↳ </span>
              <span><a className='inspire' title='Inspire HEP' 
                       href='https://inspirehep.net/record/776929' target='_blank'>
                <img src='/bib-overlay/static/icon-inspire.png'/></a>
              </span>
              <span><a className='doi' title='Journal article' 
                       href='https://doi.org/10.1016/j.physletb.2008.02.005' target='_blank'>
                <img src='/bib-overlay/static/icon-doi.png' /></a></span>
              <span><a className='scholar' title='Google Scholar' href='bogus'>
                <img src='/bib-overlay/static/icon-scholar.png'/></a></span>
              <span><a className='cite' title='Citation entry'>
                <img src='/bib-overlay/static/icon-cite.png'/></a>
              </span>
            </div>
            
          </div>
          <div className='bib-sidebar-msgs nodisplay'></div>
          <div className='bib-sidebar-source topborder'>
            <span>Data source:  </span>
            <img src='/bib-overlay/static/icon-inspire.png' title='Inspire' className='bib-selected'/>
            <img src='/bib-overlay/static/icon-ads.png' title='ADS' className='bib-unselected'/>
          </div>
        </div>
      )
    }
  }
  