import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { get_categories, get_current_article } from './arxiv_page'
import { BibModel } from './model/BibModel'
import registerServiceWorker from './registerServiceWorker'
import { BibMain, pageElementMain, pageElementSidebar } from './ui/BibMain'
import { Sidebar } from './ui/Sidebar'

const arxivid: string = get_current_article()
const categories: string[][] = get_categories()
const bibModel: BibModel = new BibModel()

ReactDOM.render(<BibMain bibModel={bibModel}/>, pageElementMain())
ReactDOM.render(<Sidebar bibModel={bibModel}/>, pageElementSidebar())

registerServiceWorker()
bibModel.configureSources(arxivid, categories)

// @ts-ignore Putting this on the document to access in the browser console
document.bibs = bibModel
