import { S2ToPaper } from '../api/S2FromJson'
import { S2Datasource } from '../api/S2Datasource'

describe( 'S2ToDoc', () => {
    const itd = new S2ToPaper( new S2Datasource() )

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

    //result of https://api.semanticscholar.org/v1/paper/arXiv:1603.05459?include_unknown_references=true
    const testJson = '{"arxivId":null,"authors":[{"authorId":"3385481","name":"Maitri Chakraborty",' +
        '"url":"https://www.semanticscholar.org/author/3385481"},{"authorId":"29672024","name":"Alessia Milani",' +
        '"url":"https://www.semanticscholar.org/author/29672024"},{"authorId":"2880183","name":"Miguel A. Mosteiro"' +
        ',"url":"https://www.semanticscholar.org/author/2880183"}],"doi":"10.1007/s00453-017-0367-4","isInfluential"' +
        ':false,"paperId":"57fce2d0abe8837b4282cb9eb3eea71d4489bbe0","title":"A Faster Exact-Counting Protocol for ' +
        'Anonymous Dynamic Networks","url":"https://www.semanticscholar.org/paper/57fce2d0abe8837b4282cb9eb3eea71d44' +
        '89bbe0","venue":"Algorithmica","year":2017}'

    it('Convert Json of single doc', () => {
        const doc = itd.reformat_document(JSON.parse(testJson), 1)
        expect(doc).toBeDefined()        
        expect(doc.authors).toBeInstanceOf(Array)
        expect(doc.authors.length).toBe(3)
        expect(doc.title).toBeDefined()
        expect(doc.title).toBe('A Faster Exact-Counting Protocol for Anonymous Dynamic Networks')
        expect(doc.year).toBe(2017)
                
        expect(doc.authors[0].name).toBe('Maitri Chakraborty')
        expect(doc.authors[0].url).toBe('https://www.semanticscholar.org/author/3385481')
    })
})
