import { InspireDatasource } from '../api/InspireDatasource'

describe( 'encoding ', () => {
    const ds = new InspireDatasource() 

    it('test encoding', () => {
        ds.aid = '0801.1021'
        expect( ds.fetch_params('eprint:0801.1021', 0) ).toBe(
          'p=eprint%3A0801.1021&of=recjson&ot=recid&ot=title&ot=doi&ot=authors&ot=number_of_citations&' +
            'ot=publication_info&ot=primary_report_number&ot=cataloguer_info&ot=system_control_number&' +
            'ot=prepublication&ot=creation_date&rg=200&sf=number_of_citations&so=a&jrec=0'
        )}
    )
})
