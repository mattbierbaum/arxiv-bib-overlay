import { action, observable } from 'mobx'
import { AdsDatasource } from '../api/AdsDatasource'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'
import { S2Datasource } from '../api/S2Datasource'
import { get_categories, get_current_article } from '../arxiv_page'
import { API_STATS_IMAGE, DATA_PROVIDER_LIST, RECORD_API_STATS } from '../bib_config'
import { cookies } from '../cookies'
import { state, Status } from './State'

export class BibModel {
    visitid: string = Math.random().toString().substring(2, 12)

    @observable
    allDS: DataSource[] = [
        new InspireDatasource(),
        new AdsDatasource(),
        new S2Datasource()
    ].filter((i) => DATA_PROVIDER_LIST.indexOf(i.shortname.toLowerCase()) >= 0)

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

    get article_category() {
        const cats: string[][] = get_categories()
        if (cats && cats.length > 0 && cats[0].length > 0) {
            return cats[0][0]
        }

        throw new Error('No primary category found')
    }

    get article_id() {
        return get_current_article()
    }

    @action
    setDS(dataSource: DataSource): void {
        state.state = Status.LOADING
        state.messages = []
        state.errors = []

        cookies.set_datasource(this.article_category, dataSource.shortname)
        this.currentDS = dataSource
        this.currentDS.fetch_all(this.article_id)
            .then(ds => this.populateFromDSResult(ds))
            .catch(error => this.populateFromDSError(error))
    }

    @action
    configureFromAbtract() {
        this.configureSources(this.article_id, this.article_category)
    }

    @action
    configureSources(arxivId: string, primary: string): void {
        this.availableDS = this.allDS.filter((ds) => ds.categories.has(primary))

        if (this.availableDS.length !== 0) {
            const selected = cookies.get_datasource(primary)

            if (selected) {
                const source = this.availableDS.filter((i) => i.shortname === selected)
                this.setDS(source[0])
            } else {
                this.setDS(this.availableDS[0])
            }
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
        if (!RECORD_API_STATS) {
            return
        }

        const cats = get_categories().map((i) => i[1]).join(':')
        const active = state.isdisabled ? 'disabled' : 'enabled'
        const ds = state.bibmodel.currentDS ? state.bibmodel.currentDS.shortname : 'none'
        fetch(`${API_STATS_IMAGE}?${ds}&${cats}&${active}&${this.visitid}`)
    }
}
