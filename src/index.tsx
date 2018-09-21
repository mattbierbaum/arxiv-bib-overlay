import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { pageElementMain, pageElementSidebar } from './arxiv_page'
import { cookie_load } from './cookies'
import { state, Status } from './model/State'
//import registerServiceWorker from './registerServiceWorker'
import { BibMain } from './ui/BibMain'
import { Sidebar } from './ui/Sidebar'

const active = cookie_load()
state.state = active ? Status.INIT : Status.DISABLED

ReactDOM.render(<BibMain state={state}/>, pageElementMain())
ReactDOM.render(<Sidebar state={state}/>, pageElementSidebar())

//registerServiceWorker()
if (active) {
    state.bibmodel.configureFromAbtract()
    //state.bibmodel.configureSources('1603.04467', [['cs', 'cs.ML']])
    //state.bibmodel.configureSources(arxivid, categories)
    //state.bibmodel.configureSources('1703.00001', [['cs', 'cs.ML']])
    //state.bibmodel.configureSources('1603.04891', [['cs', 'cs.ML']])
    //state.bibmodel.configureSources('hep-th/9711200', [['hep-th', 'hep-th']])
    //state.bibmodel.configureSources('1711.04170', [['cs', 'cs.ML']])
} else {
    state.bibmodel.record_api()
}

// @ts-ignore -- for debugging purposes
document.state = state
