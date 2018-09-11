import icon from '../assets/icon-s2.png'
import sourceLogo from '../assets/source-s2.png'
//import { API_ARTICLE_COUNT } from '../bib_config'
//import { encodeQueryData } from '../bib_lib'
import { BasePaper, DataSource, Paper } from './document'
import { S2ToPaper } from './S2FromJson'

export class S2Datasource implements DataSource {
    data: BasePaper
    cache: { [key: string]: Paper } = {}
    aid: string

    logo = sourceLogo
    icon = icon

    email = 'help@semanticscholar.org'
    shortname = 'S2'
    longname = 'Semantic Scholar'
    categories = new Set(['cs', 'stat.ML'])
    homepage = 'https://semanticscholar.org'
    api_url = 'https://api.semanticscholar.org/v1/'
    api_params = {include_unknown_references: 'true'}

    sorting = {
        sorters: {
            paper: {name: 'Paper order', func: (i) => i.index},
            influence: {name: 'Influence', func: (i) => i.isInfluential},
            author: {name: 'First author', func: (i) => i.authors[0] && i.authors[0].tolastname()},
            title: {name: 'Title', func: (i) => i.title.toLowerCase()},
            year: {name: 'Year', func: (i) => i.year},
        },
        sorters_order: ['influence', 'title', 'author', 'year'],
        sorters_default: 'influence',
    }

    json_to_doc = new S2ToPaper(this)

    url_paper(arxivid: string) {
        return `${this.api_url}paper/arXiv:${arxivid}?${this.api_params}`
    }

    populate(json: any) {
        const output: BasePaper = this.json_to_doc.reformat_document(json, 0)

        if (json.citations) {
            output.citations = {
                documents: json.citations.map((doc) => this.json_to_doc.reformat_document(doc, 0)),
                header: 'Citations',
                header_url: `${json.url}#citingPapers`,
                description: 'highly influenced citations',
                count: json.citations.length,
                sorting: this.sorting,
            }
        }

        if (json.references) {
            output.citations = {
                documents: json.references.map((doc) => this.json_to_doc.reformat_document(doc, 0)),
                header: 'References',
                header_url: `${json.url}#citedPapers`,
                description: 'highly influenced references',
                count: json.references.length,
                sorting: this.sorting,
            }
        }

        this.data = output
    }

        /*async_load: function(callback){
        this.aid = bib_lib.get_current_article();
        var url = this.url_paper(this.aid);

        if (url in this.cache){
            callback(this);
            return;
        }

        $.ajax({
            type: 'GET',
            url: bib_lib.urlproxy(url),
            async: true,
            timeout: bib_config.API_TIMEOUT,
            success: $.proxy(
                function(data){
                   this.data = this.transform_result(data);
                   this.cache[url] = this.data;
                   callback(this);
                }, this
            ),
            error: this.query_error,
        });
    }

    get_paper: function(url, callback){
        if (url in this.cache)
            return callback(this.cache[url]);

        $.get(url, $.proxy(
            function(data){
                data = this.transform_result(data);
                this.cache[url] = data;
                callback(data);
            }, this)
        )
        .fail(function(err) {});
    }*/

    fetch_all(arxiv_id: string): Promise<S2Datasource> {
        this.aid = arxiv_id

        return fetch(this.url_paper(this.aid))
            .then(resp => resp.json())
            .then(json => {
                this.populate(json)
                return this
            })
    }
}
