import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { InspireDatasource } from './api/inspire_fetch'
import './index.css'
import registerServiceWorker from './registerServiceWorker'
import App from './ui/App'
import { Sidebar } from './ui/Sidbar'

// FIX ME: get paper id from page
//const paper_id = '0704.0001'

export const inspireDs = new InspireDatasource()

// @ts-ignore Putting this on the document to access in the browser console
document.inspireDs = inspireDs 

ReactDOM.render(
  <App  />,
  document.getElementById('bib-main') as HTMLElement
)

ReactDOM.render(
  <Sidebar doc={inspireDs.data} />,
  document.getElementById('bib-sidebar') as HTMLElement
)

registerServiceWorker()
