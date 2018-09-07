import DevTools from 'mobx-react-devtools'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BibModel } from './model/BibModel'
import registerServiceWorker from './registerServiceWorker'
import { BibMain } from './ui/BibMain'
import { Sidebar } from './ui/Sidbar'

// FIX ME: get paper id from page
//const paper_id = '0704.0001'
//const categories = 

const bibModel: BibModel = new BibModel()
// @ts-ignore Putting this on the document to access in the browser console
document.bibs = bibModel

bibModel.currentDs = bibModel.adsDs

ReactDOM.render(
  <BibMain bibModel={bibModel}  />, 
  document.getElementById('bib-main') as HTMLElement
)

ReactDOM.render(
  <div>
     <DevTools />
    <Sidebar bibModel={bibModel} />
    </div> , 
  document.getElementById('bib-sidebar') as HTMLElement
)

registerServiceWorker()

//Kicsk off async request
bibModel.loadFromPaper('0801.1021', 'unknown for now')
// bibModel.inspireDs.fetch_all('0801.1021')
//   .then(ds => { bibModel.currentDs = ds; bibModel.paper = ds.data })
