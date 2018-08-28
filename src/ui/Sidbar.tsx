import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import { BibModel } from '../model/BibModel'
import { Outbound } from './Outbound'

@observer
export class Sidebar extends React.Component<{ bibModel: BibModel}, {}> {
    public render() {        
        
        if ( ! this.props.bibModel || ! this.props.bibModel.paper || ! this.props.bibModel.paper.authors) {
            return <div>loading bibs...</div>
        }
        
        const au_lis = this.props.bibModel.paper.authors.map( au => 
          <li><a href={au.url} target='_blank'>{au.name}</a></li> )
        
        return (
          <div className='delete bib-sidebar'>          
            <div className='bib-sidebar-paper' >
              <h3>Citations for authors</h3>
              <ul className='bib-sidebar-authors'>{au_lis}</ul>            
              <Outbound paper={this.props.bibModel.paper}/>                        
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
  