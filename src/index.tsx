import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './index.css'
import { BibModel } from './model/BibModel'
import registerServiceWorker from './registerServiceWorker'
import App from './ui/App'
import { Sidebar } from './ui/Sidbar'

// FIX ME: get paper id from page
//const paper_id = '0704.0001'

const bibModel: BibModel = new BibModel()
// @ts-ignore Putting this on the document to access in the browser console
document.bibs = bibModel

ReactDOM.render(
  <App  />,
  document.getElementById('bib-main') as HTMLElement
)

ReactDOM.render(
  <Sidebar bibModel={bibModel} />,
  document.getElementById('bib-sidebar') as HTMLElement
)

registerServiceWorker()

//Kicsk off async request
bibModel.inspireDs.fetch_all('0801.1021')
  .then(ds => bibModel.paper = ds.data )
