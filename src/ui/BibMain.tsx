import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import { BibModel } from '../model/BibModel'
import { ColumnView } from './ColumnView'

@observer
export class BibMain extends React.Component<{bibModel: BibModel}, {}> {
    render() {                
        const bibModel = this.props.bibModel
        const ds = bibModel.currentDs

        if (! this.props.bibModel.references && ! this.props.bibModel.citations) {
            return (<div>loading...</div>)
        } else {
            return(
                <div className='bib-main'>
                  <h1 className='bib-header'>
                    <span><a href={ds.homepage}><img src={ds.logo}/></a></span>
                  </h1>            
                  <div className='bib-col2'>
                    <ColumnView name='References' paperGroup={bibModel.references}/>
                    <ColumnView name='Citations' paperGroup={bibModel.citations}/>
                  </div>
                </div >)
        }        
    }
}
