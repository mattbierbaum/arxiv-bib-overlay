import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import { BibModel } from '../model/BibModel'
import { ColumnView } from './ColumnView'
import { spinner } from './Spinner'

@observer
export class BibMain extends React.Component<{bibModel: BibModel}, {}> {
    render() {                
        const bibModel = this.props.bibModel
        const ds = bibModel.currentDs

        if (!this.props.bibModel.references && !this.props.bibModel.citations) {
            return spinner()
        } else {
            return(
                <div className='bib-main'>
                  <div className='bib-col2'>
                    <ColumnView name='References' paperGroup={bibModel.references} dataSource={ds}/>
                    <ColumnView name='Citations' paperGroup={bibModel.citations} dataSource={ds}/>
                  </div>
                </div>
            )
        }        
    }
}
