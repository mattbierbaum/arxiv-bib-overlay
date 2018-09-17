import { action, observable } from 'mobx'
import { AdsDatasource } from '../api/AdsDatasource'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'
import { S2Datasource } from '../api/S2Datasource'
import { state, Status } from './State'

export class BibModel {
    arxivId: string = ''
    categories: string[][]

    @observable
    allDS: DataSource[] = [
        new InspireDatasource(),
        new AdsDatasource(),
        new S2Datasource()
    ]

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
        dataSource.fetch_all(this.arxivId)
            .then(ds => this.populateFromDSResult(ds))
            .catch(error => this.populateFromDSError(error))
    }

    @action
    configureSources(arxivId: string, categories: string[][]): void {
        const primary = categories[0][0]
        this.arxivId = arxivId
        this.categories = categories

        this.availableDS = this.allDS.filter((ds) => ds.categories.has(primary))
        this.setDS(this.availableDS[0])
    }

    populateFromDSResult(ds: DataSource): void {
        state.state = Status.LOADED
        this.currentDS = ds

        this.paper = ds.data
        if (ds.data.citations) {
            this.citations = ds.data.citations
        }
        if (ds.data.references) {
            this.references = ds.data.references
        }
    }

    populateFromDSError(error: Error): void {
        state.error(error.message)

    }
}
