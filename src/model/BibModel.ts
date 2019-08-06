import { action, observable } from 'mobx'
import { AdsDatasource } from '../api/AdsDatasource'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'
import { ProphyDatasource } from '../api/ProphyDatasource'
import { S2Datasource } from '../api/S2Datasource'
import { get_categories, get_current_article, get_primary_category, topaper } from '../arxiv_page'
import { API_STATS_IMAGE, POLICY_DATASOURCE_LIST, POLICY_RECORD_API_STATS } from '../bib_config'
import { random_id } from '../bib_lib'
import { cookies } from '../cookies'
import { state, Status } from './State'

export class BibModel {
    arxivId: string = ''
    primary: string = ''
    visitid: string = random_id()

    @observable
    allDS: DataSource[] = [
        new S2Datasource(),
        new InspireDatasource(),
        new AdsDatasource(),
        new ProphyDatasource()
    ].filter((i) => POLICY_DATASOURCE_LIST.indexOf(i.shortname.toLowerCase()) >= 0)

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

    @observable
    arxiv_paper: Paper

    configureAvailableFromAbstract() {
        this.arxiv_paper = topaper()
        this.configureAvailable(get_primary_category())
    }

    configureAvailable(category: string) {
        this.availableDS = this.allDS.filter((ds) => ds.categories.has(category))
    }

    @action
    setDS(dataSource: DataSource): void {
        state.state = Status.LOADING
        state.messages = []
        state.errors = []

        cookies.set_datasource(this.primary, dataSource.shortname)
        this.currentDS = dataSource
        this.currentDS.fetch_all(this.arxivId)
            .then(ds => this.populateFromDSResult(ds))
            .catch(error => this.populateFromDSError(error))
    }

    @action
    loadFromAbtract() {
        const arxivId = get_current_article()
        const primary = get_primary_category()
        this.loadSource(arxivId, primary)
    }

    @action
    loadSource(arxivId: string, primary: string): void {
        this.arxivId = arxivId
        this.primary = primary

        this.configureAvailable(this.primary)
        if (this.availableDS.length !== 0) {
            const savedDS = cookies.get_datasource(primary)

            if (savedDS) {
                const source = this.availableDS.filter((i) => i.shortname === savedDS)
                this.setDS(source[0])
            } else {
                this.setDS(this.availableDS[0])
            }
        }
        this.record_api()
    }

    @action
    reloadSource(): void {
        if (!this.currentDS) {
            this.loadFromAbtract()
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
    populateFromDSError(error: any): void {
        state.error(error)
    }

    record_api() {
        if (!POLICY_RECORD_API_STATS) {
            return
        }

        const cats = get_categories().map((i) => i[1]).join(':')
        const active = state.isdisabled ? 'disabled' : 'enabled'
        const ds = state.bibmodel.currentDS ? state.bibmodel.currentDS.shortname : 'none'
        fetch(`${API_STATS_IMAGE}?${ds}&${cats}&${active}&${this.visitid}`)
    }
}
