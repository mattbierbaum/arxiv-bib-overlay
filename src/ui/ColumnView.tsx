import * as React from 'react'
import { PaperGroup } from '../api/document'
import { PaperDiv } from './PaperDiv'

export class ColumnView extends React.Component<{ paperGroup: PaperGroup, name: string}, {}> {

  render() { 
    const group = this.props.paperGroup
    const papers = (group && group.documents) || []

    if ( ! this.props.paperGroup ) { return null }

    return (
    <div className='bib-col' id={'col-' + this.props.name.toLocaleLowerCase()}>
      <div className='bib-col-header'>
        <span className='bib-col-center'>
          <a className='bib-col-title' href={group.header_url}>
            {this.props.name} ({group.count})
          </a>
        </span>        
      </div>
    
      <div className='bib-utils'>

        <div className='center'>
          <span>                
            <span>Pages: </span>
            <ul className='bib-page-list'>
              <li><span className='disabled'>◀</span></li>
              <li><span className='bold'>1</span></li>
              <li><a href='javascript:;'>2</a></li>
              <li><a href='javascript:;'>3</a></li>
              <li><a href='javascript:;'>4</a></li>
              <li><a href='javascript:;'>▶</a></li>
            </ul>                
            <select>
              <option value='1'>1</option>
              <option value='2'>2</option>
              <option value='3'>3</option>
              <option value='4'>4</option>
              </select>
          </span>
        </div>

        <div className='center'>
          <span>
            <div className='bib-sorter'>
              <span className='sort-label'>Sort by: </span>
              <select className='sort_field'>
                <option value='citations'>Citations</option>
                <option value='influence'>ADS read count</option>
                <option value='title'>Title</option>
                <option value='author'>First author</option>
                <option value='year'>Year</option>
              </select>
              <span className='sort-arrow sort-label'>
                <a><span className='disabled' title='Sort ascending'>▲</span>
                   <span title='Sort descending'>▼</span></a>
              </span>
            </div>
          </span>              
        </div>
        
        <div className='center'>
          <div className='bib-filter'>
            <span className='bib-filter-label'>Filter: </span>
            <input type='search' className='bib-filter-input'/>
          </div>
        </div>
      </div> {/* end of bib-utils */}

      <div>{papers.map(paper => <PaperDiv paper={paper}/>)}</div>
    </div>
    )
  }
}