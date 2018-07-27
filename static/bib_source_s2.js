//============================================================================
// S2 specific transformations
//============================================================================
function S2Data() {
    this.cache = {};
    this.data = {};
    this.aid = null;
}

S2Data.prototype = {
    url_logo: bib_lib.asset_url('static/source-s2.png'),
    url_icon: bib_lib.asset_url('static/icon-s2.png'),

    shortname: 'S2',
    longname: 'Semantic Scholar',
    categories: new Set(['cs', 'stat.ML']),
    homepage: 'https://semanticscholar.org',
    api_url: 'https://api.semanticscholar.org/v1/',
    api_params: 'include_unknown_references=true',

    url_paper: function(id) {return bib_lib.urlproxy(this.api_url+'paper/arXiv:'+id+'?'+this.api_params);},
    url_paperId: function(id) {return bib_lib.urlproxy(this.api_url+'paper/'+id+'?'+this.api_params);},
    url_author: function(id) {return this.api_url+'author/'+id;},

    add_api_url: function(data){
        if ('paperId' in data)
            data.api = this.url_paperId(data.paperId);
    },

    add_url_arxiv: function(data){
        if (data.arxivId)
            data.url_arxiv = 'https://arxiv.org/abs/'+data.arxivId;
        else
            data.url_arxiv = '';
    },

    add_url_doi: function(data){
        data.url_doi = data.doi ? 'https://doi.org/'+data.doi : '';
    },

    searchline: function(doc){
        return [doc.title, doc.venue, doc.year].join(' ').toLowerCase();
    },

    outbound_names: function(ref){
        outs = [];
        outs.push(this.shortname.toLowerCase());
        if (ref.url_arxiv) outs.push('arxiv');
        if (ref.url_doi) outs.push('doi');
        outs.push('scholar');
        if (ref.doi || ref.arxivid) outs.push('cite');
        return outs;
    },

    reformat_document: function(data, index){
        this.add_api_url(data);
        this.add_url_arxiv(data);
        this.add_url_doi(data);
        data.index = index;
        data.arxivid = data.arxivId;
        data.searchline = this.searchline(data);
        data.outbound = this.outbound_names(data);
    },

    add_counts: function(data){
        data.citations.count = data.citations.length;
        data.references.count = data.references.length;
    },

    transform_result: function(data){
        this.reformat_document(data);

        var ind;
        for (ind in data.citations)
            this.reformat_document(data.citations[ind], ind);
        for (ind in data.references)
            this.reformat_document(data.references[ind], ind);

        data.citations.header = 'Citations';
        data.references.header = 'References';
        data.citations.header_url = data.url + '#citingPapers';
        data.references.header_url = data.url + '#citedPapers';
        data.citations.description = 'highly influenced citations';
        data.references.description = 'highly influential references';
        this.add_counts(data);
        return data;
    },

    async_load: function(callback){
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
            timeout: bib_lib.API_TIMEOUT,
            success: $.proxy(
                function(data){
                   this.data = this.transform_result(data);
                   this.cache[url] = this.data;
                   callback(this);
                }, this
            ),
            error: this.query_error,
        });
    },

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
    },

    sorters: {
        'paper': {'name': 'Paper order', 'func': function(i){return i.index;}},
        'influence': {'name': 'Influence', 'func': function(i){return i.isInfluential;}},
        'title': {'name': 'Title', 'func': function(i){return i.title.toLowerCase();}},
        'year': {'name': 'Year', 'func': function(i){return i.year;}},
    },
    sorters_order: ['influence', 'title', 'year'],
    sorters_default: 'influence',
};
