import { action, observable } from 'mobx'
import { AdsDatasource } from '../api/AdsDatasource'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'
import { S2Datasource } from '../api/S2Datasource'
import { get_categories, get_current_article } from '../arxiv_page'
import { API_STATS_IMAGE } from '../bib_config'
import { state, Status } from './State'

export class BibModel {
    visitid: string = Math.random().toString().substring(2, 12)
    arxivId: string = ''
    categories: string[][]

    @observable
    allDS: DataSource[] = [
        new InspireDatasource(),
        new AdsDatasource(),
        new S2Datasource()
    ].slice(2, 3)

    @observable
    availableDS: DataSource[]

    @observable
    currentDS: DataSource

    @observable
    paper: Paper

    @observable
    citations: PaperGroup

    @observable
    references: PaperGroup

    @action
    setDS(dataSource: DataSource): void {
        state.state = Status.LOADING
        state.messages = []
        state.errors = []

        this.currentDS = dataSource
        this.currentDS.fetch_all(this.arxivId)
            .then(ds => this.populateFromDSResult(ds))
            .catch(error => this.populateFromDSError(error))
    }

    @action
    configureFromAbtract() {
        const arxivid: string = get_current_article()
        const categories: string[][] = get_categories()
        this.configureSources(arxivid, categories)
    }

    @action
    configureSources(arxivId: string, categories: string[][]): void {
        const primary = categories[0][0]
        this.arxivId = arxivId
        this.categories = categories

        this.availableDS = this.allDS.filter((ds) => ds.categories.has(primary))

        if (this.availableDS.length !== 0) {
            this.setDS(this.availableDS[0])
        }
        this.record_api()
    }

    @action
    reconfigureSources(): void {
        if (!this.currentDS) {
            this.configureFromAbtract()
        } else {
            this.setDS(this.currentDS)
            this.record_api()
        }
    }

    @action
    populateFromDSResult(ds: DataSource): void {
        state.state = Status.LOADED

        this.paper = ds.data
        if (ds.data.citations) {
            this.citations = ds.data.citations
        }
        if (ds.data.references) {
            this.references = ds.data.references
        }
    }

    @action
    populateFromDSError(error: Error): void {
        state.error(error.message)
    }

    record_api() {
        const cats = get_categories().map((i) => i[1]).join(':')
        const active = state.isdisabled ? 'disabled' : 'enabled'
        const ds = state.bibmodel.currentDS ? state.bibmodel.currentDS.shortname : 'none'
        fetch(`${API_STATS_IMAGE}?${ds}&${cats}&${active}&${this.visitid}`)
    }
}
