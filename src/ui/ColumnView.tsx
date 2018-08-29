import { computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import { Paper, PaperGroup, SorterConfig } from '../api/document'
import { sorter } from './ColumnSorter'
import { PaperDiv } from './PaperDiv'

@observer
export class ColumnView extends React.Component<{ paperGroup: PaperGroup, name: string}, {}> {

  @observable
  sort_field: string

  @observable
  sort_order: 'up'|'down' = 'up'
  
  filter_text: ''
  npages
  page = 1

  /** 
   * Filtered sorted papers for this column.
   * @computed makes it so this value will trigger a render change when
   * it's dependent observable values change.
   */
  @computed
  get fdata(): Paper[] {
    if (! this.props.paperGroup) { return []}    
    const datacopy = this.props.paperGroup.documents.slice()            
    return  this.filterPapers(this.sortPapers( this.props.paperGroup, datacopy ))    
  }

  render() { 
    const group = this.props.paperGroup
    const papers = (group && this.fdata) || []
    
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
          {this.create_paging()}
        </div>
        <div className='center'>
          {this.create_sorter(this.sort_field, this.props.paperGroup.sorting)}
        </div>        
        <div className='center'>
          {this.create_filter()}
        </div>
      </div>

      <div>
        {papers.map(paper => <PaperDiv key={paper.recid || paper.url} paper={paper}/>)}
      </div>
    </div>
    )
  }

    create_filter() {
    return (<div className='bib-filter'>
      <span className='bib-filter-label'>Filter: </span>
      <input type='search' className='bib-filter-input'/>
    </div>)
  }

    create_paging() {
    return(<span>                
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
    </span>)    
  }

  sortPapers( paperGroup: PaperGroup, data: Paper[] ): Paper[] {    
    if ( !paperGroup || ! data) { return [] }

    const field = this.sort_field || paperGroup.sorting.sorters_default    
    const sorters = this.props.paperGroup.sorting.sorters        

    if ( sorters[field] && sorters[field].func ) {            
      return sorter( data, sorters[field].func, this.sort_order)      
    } else {
      console.log(`Could not sort: no sort entry in sorter for '${field}`)
      return data
    }    
  }

  filterPapers( data: Paper[] ): Paper[] {
    console.log('TODO implement filterPapers()')
    return data
  }

  changeSort(event: any) {
    this.sort_field = event.target.value
  }

  toggleSort(event: any) {    
    this.sort_order = this.sort_order === 'up' ? 'down' : 'up'
  }

  create_sorter(sort_field: string, sortConfig: SorterConfig) {
    if ( !sortConfig ) {
      return null
    }    
    
    return(<span >
    <div className='bib-sorter'>
      <span className='sort-label'>Sort by: </span>      
      <select className='sort_field' onChange={(e) => this.changeSort(e)} value={sort_field}>
        {this.sort_options(sortConfig)}
      </select>

      <span className='sort-arrow sort-label'>
        <a  onClick={(e) => this.toggleSort(e)}>
          <span className={this.sort_order !== 'up' ? 'disabled' : ''}   title='Sort ascending'>▲</span>
          <span className={this.sort_order !== 'down' ? 'disabled' : ''} title='Sort descending'>▼</span>
        </a>
      </span>
    </div>
    </span >   )
  }

  sort_options( sortConfig: SorterConfig) {    
    if ( !sortConfig ) { return [] }

    return sortConfig.sorters_order.map(key => {      
      if (sortConfig.sorters[key]) {
        return (<option value={key} key={key}>{sortConfig.sorters[key].name}</option>)        
      } else {
        if ( key ) {console.log(`No sorter with key ${key}`) }
        return null        
      }
    })
  }
}