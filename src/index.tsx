import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <App />,
  document.getElementById('bib-main') as HTMLElement
)

ReactDOM.render(
  <App />,
  document.getElementById('bib-sidebar') as HTMLElement
)

registerServiceWorker()
