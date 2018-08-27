import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { InspireDatasource } from './api/inspire_fetch'
import App from './App'
import './index.css'
import registerServiceWorker from './registerServiceWorker'

// FIX ME: get paper id from page
//const paper_id = '0704.0001'

export const inspireDs = new InspireDatasource()
// @ts-ignore
document.inspireDs = inspireDs 

ReactDOM.render(
  <App  />,
  document.getElementById('bib-main') as HTMLElement
)

ReactDOM.render(
  <App />,
  document.getElementById('bib-sidebar') as HTMLElement
)

registerServiceWorker()
