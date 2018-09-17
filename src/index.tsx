import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { get_categories, get_current_article } from './arxiv_page'
import { state } from './model/State'
import registerServiceWorker from './registerServiceWorker'
import { BibMain, pageElementMain, pageElementSidebar } from './ui/BibMain'
import { Sidebar } from './ui/Sidebar'

const arxivid: string = get_current_article()
const categories: string[][] = get_categories()

ReactDOM.render(<BibMain state={state}/>, pageElementMain())
ReactDOM.render(<Sidebar state={state}/>, pageElementSidebar())

registerServiceWorker()
state.bibmodel.configureSources(arxivid, categories)
//state.bibmodel.configureSources('1703.00001', [['cs', 'cs.ML']])
