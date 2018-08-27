import { InspireToDoc } from '../api/inspire_to_doc'
import { InspireDatasource } from '../api/inspire_fetch'

describe( 'InspireToDoc', () => {
    const itd = new InspireToDoc( new InspireDatasource() )

    it('constructs', () => {
        expect( itd ).not.toBeFalsy()
    })

    it('Funny inputs should throw error', () => {        
        expect(() => { itd.reformat_document({}, 0)} )
        .toThrow()
        expect(() => { itd.reformat_document(undefined, 0)} )
        .toThrow()
        expect(() => { itd.reformat_document('', 0)} )
        .toThrow()
        expect(() => { itd.reformat_document(null, 0)} )
        .toThrow()
    })  

    //result of http://inspirehep.net/search?p=hep-th/9711201&of=recjson&ot=recid,number_of_citations,authors,title,year
    const testJson = '[{"authors": [{"affiliation": ["Rome U., Tor Vergata", "INFN, Rome"], "first_name": "Massimo", ' +
          '"last_name": "Bianchi", "full_name": "Bianchi, Massimo"}],' +
          '"title": {"title": "A Note on toroidal compactifications of the type I superstring and other superstring ' +
          'vacuum configurations with sixteen supercharges"}, ' +
      '"recid": 451648, "number_of_citations": 106, "year": null}]'

    it('Convert Json of single doc', () => {
        const doc = itd.reformat_document(JSON.parse(testJson)[0], 1)
        expect(doc).toBeDefined()        
        expect(doc.authors).toBeInstanceOf(Array)
        expect(doc.authors.length).toBe( 1 )
        expect(doc.title).toBeDefined()
        expect(doc.title).toBe('A Note on toroidal compactifications of the type I superstring and other superstring ' +
                             'vacuum configurations with sixteen supercharges')
        expect(doc.recid).toBe('451648')
        expect(doc.year).toBe('')
                
        expect(doc.authors[0].name).toBe('Massimo Bianchi')
        expect(doc.authors[0].url).toBe('https://inspirehep.net/author/profile/Bianchi, Massimo?recid=451648')
    })

    var data = require('./250.json')
    it('Convert list of docs', () => {
        const docs = itd.reformat_documents(data, 1)
        expect(docs).toBeDefined()
        expect(docs).toBeInstanceOf(Array)    
        expect(docs.length).toBe(106)
    } )    

} )
