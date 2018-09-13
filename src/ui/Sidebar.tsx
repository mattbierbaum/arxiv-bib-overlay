import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import { MAX_AUTHORS } from '../bib_config'
import { BibModel } from '../model/BibModel'
import { Outbound, OutboundCite } from './Outbound'
import { spinner } from './Spinner'

@observer
export class Sidebar extends React.Component<{bibModel: BibModel}, {}> {
    public render() {
        const bib = this.props.bibModel

        if (!bib || !bib.paper || !bib.paper.authors) {
            return spinner()
        }

        const auth_elements = bib.paper.authors.map(
            au => <li key={au.url}><a href={au.url} target='_blank'>{au.name}</a></li>
        )

        let paper_title = bib.paper.title
        if (paper_title.length > 23) {
            paper_title = paper_title.substring(0, 20) + '...'
        }

        let auth_list = auth_elements
        if (auth_list.length > MAX_AUTHORS) {
            auth_list = auth_list.slice(0, MAX_AUTHORS)
            auth_list.push(
                <li key={bib.paper.url}><a href={bib.paper.url} target='_blank'>...</a></li>
            )
        }

        return (
            <div className='bib-sidebar-paper' >
              <div className='bib-sidebar-title'>
                <span><a href={bib.paper.url} target='_blank'>{paper_title}</a></span>
              </div>
              <ul className='bib-sidebar-authors'>{auth_list}</ul>
              <Outbound paper={this.props.bibModel.paper}/>
              <OutboundCite paper={this.props.bibModel.paper}/>
            </div>
        )
    }
  }
