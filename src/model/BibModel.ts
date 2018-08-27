import { action, observable } from 'mobx'
import { DataSource, Paper, PaperGroup } from '../api/document'
import { InspireDatasource } from '../api/InspireDatasource'

export class BibModel {    
    @observable
    inspireDs: InspireDatasource = new InspireDatasource()
    
    @observable
    currentDs: DataSource

    @observable
    avaiableDs: DataSource[]

    @observable
    paper: Paper

    @observable
    citations: PaperGroup

    @observable
    references: PaperGroup

    @action
    loadFromPaper( arxivId: string, categories: string): void {    
        //TODO:
        //Figure out which DS are avaiable
        //load the first
        //copy results into this.paper this.citations this.references
        
        this.inspireDs.fetch_all('0801.1021')
            .then(ds => this.populateFromDsResult(ds) )        
    }

    populateFromDsResult( ds: DataSource ): void {
        this.currentDs = ds
        
        this.paper = ds.data        
        if ( ds.data.citations ) {
            this.citations = ds.data.citations        
        }
        if ( ds.data.references) {
            this.references = ds.data.references
        }
    }
}