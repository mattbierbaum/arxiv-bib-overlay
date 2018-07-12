//============================================================================
// HEP inspire api
//============================================================================
function InspireData() {
    this.ready = {};
    this.rawdata = {}
    this.cache = {};
    this.data = {}
    this.aid = null;
}

InspireData.prototype = {
    url_logo: asset_url('static/source-inspire.png'),
    url_icon: asset_url('static/icon-inspire.png'),

    shortname: 'Inspire',
    categories: new Set(['hep-th', 'hep-ex', 'hep-ph', 'hep-lat', 'gr-qc']),
    homepage: 'https://inspirehep.net',
    pagelength: 250,
    api_url: 'https://inspirehep.net/search',
    api_params: {
        p:  'a query',  // pattern (query)
        of: 'recjson',  // output format
        ot: [           // output tags
            'recid',
            'title',
            'doi',
            'authors',
            'number_of_citations',
            'publication_info',
            'primary_report_number',
            'cataloguer_info',
            'system_control_number',
            'prepublication',
            'creation_date',
        ],
        rg: API_ARTICLE_COUNT,      // records in groups of
        sf: 'number_of_citations',  // sort field: citation count
        so: 'a'                     // sort order: descending
        //jrec: 250     // jump to record
    },

    url_paper: function(id) {return this.homepage+'/record/'+id;},
    url_paper_api: function(id) {return this.api_url+'?'+encodeQueryData({'p': 'recid:'+id, 'of': 'recjson'});},
    url_author: function(name, recid) {return this.homepage+'/author/profile/'+name+'?'+encodeQueryData({'recid': recid});},
    url_arxiv: function(arxivid){return arxivid ? 'https://arxiv.org/abs/'+arxivid : null;},

    doc_arxiv_id: function(doc){
        var reports = doc.primary_report_number;
        if (reports && typeof reports == 'string'){
            var match = RE_IDENTIFIER.exec(reports);
            if (match) return (match[1] || match[2]);
        } else if (reports){
            for (var i=0; i<reports.length; i++){
                var match = RE_IDENTIFIER.exec(reports[i]);
                if (match) return (match[1] || match[2]);
            }
        }
    },

    doc_year: function(doc){
        if (doc.publication_info && doc.publication_info.year)
            return doc.publication_info.year;

        if (doc.cataloguer_info && doc.cataloguer_info.length > 0)
            return doc.cataloguer_info[0].creation_date.substring(0,4);

        if (doc.prepublication && doc.prepublication.date)
            return doc.prepublication.date.substring(0,4);

        if (doc.creation_date)
            return doc.creation_date.substring(0,4);

        return '';
    },

    doc_title: function(doc){
        if (!doc.title || !doc.title.title) return '';
        return doc.title.title;
    },

    doc_authors: function(doc){
        var auths = doc.authors;

        if (!auths) return [];

        output = [];
        for (var i=0; i<auths.length; i++){
            var name = [auths[i].first_name, auths[i].last_name].join(' ');
            var url = this.url_author(auths[i].full_name, doc.recid);
            output.push({
                name: name,
                url: url,
            });
        }
        return output;
    },

    doc_venue: function(doc){
        var pubs = doc.publication_info;

        if (!pubs) return '';

        for (var i=0; i<pubs.length; i++){
            if (pubs[i].title)
                return pubs[i].title.split('.').join(' ');
        }

        return '';
    },

    searchline: function(doc){
        var auths = '';
        for (var i=0; i<doc.authors.length; i++){
            auths += doc.authors[i].name + ' ';
        }
        return [doc.title, auths, doc.venue, doc.year].join(' ').toLowerCase();
    },

    outbound_names: function(ref){
        outs = [];
        outs.push(this.shortname.toLowerCase());
        if (ref.url_arxiv) outs.push('arxiv');
        if (ref.url_doi) outs.push('doi');
        outs.push('scholar');
        return outs;
    },

    reformat_document: function(doc, index){
        var arxivid = this.doc_arxiv_id(doc);
        var doc = {
            'title': this.doc_title(doc),
            'authors': this.doc_authors(doc),
            'year': this.doc_year(doc),
            'venue': this.doc_venue(doc),
            'citation_count': doc.number_of_citations,
            'recid': doc.recid.toString(),
            'paperId': doc.recid.toString(),
            'index': index,
            'api': this.url_paper_api(doc.recid.toString()),
            'url': this.url_paper(doc.recid),
            'url_doi': doc.doi ? 'https://doi.org/'+doc.doi : '',
            'url_arxiv': this.url_arxiv(arxivid),
        };
        doc.searchline = this.searchline(doc);
        doc.outbound = this.outbound_names(doc);
        return doc;
    },

    reformat_documents: function(docs){
        if (!docs) return [];

        var output = [];
        for (var i=0; i<docs.length; i++){
            var d = this.reformat_document(docs[i], i);
            this.cache[d.api] = d;
            output.push(d);
        }
        return output;
    },

    add_counts: function(data){
        data.citations.count = data.citation_count;
        data.references.count = data.references.length;
    },
    // t0: "http://inspirehep.net/search?p=hep-th/9711201&of=recjson&ot=recid,number_of_citations,authors,title,year",
    // t1: "http://inspirehep.net/search?p=refersto:recid:451648&of=recjson&rg=250",
    // t2: "http://inspirehep.net/search?p=citedby:recid:451648&of=recjson&rg=250&ot=title,year,authors"

    load_data_callback: function(callback) {
        if ('base' in this.ready && 'citations' in this.ready && 'references' in this.ready){
            var output = this.reformat_document(this.rawdata.base.docs[0]);
            output.citations = this.reformat_documents(this.rawdata.citations.docs);
            output.references = this.reformat_documents(this.rawdata.references.docs);

            output.citations.header = 'Citations';
            output.references.header = 'References';
            output.citations.header_url = output.url + '/citations';
            output.references.header_url = output.url + '/references';
            output.citations.description = '';
            output.references.description = '';

            this.data = output;
            this.add_counts(this.data);
            callback(this);
        }
    },

    load_all: function(query, obj, callback, index, docs){
        var params = $.extend(true, {}, this.api_params);
        params['p'] = query;
        params['jrec'] = index * this.pagelength;
        var url = this.api_url+'?'+encodeQueryData(params);

        if (obj in this.rawdata){
            this.ready[obj] = true;
            this.load_data_callback(callback);
            return;
        }

        $.ajax({
            type: 'GET',
            url: urlproxy(url),
            dataType: 'text',
            async: true,
            timeout: API_TIMEOUT,
            error: this.error_wrapper(function(x, t, m) {
                if (t === "timeout") {
                    throw new Error("Query timed out");
                } else {
                    throw new Error("Query generated error: "+t);
                }
            }),
            success: $.proxy(
                function (data){
                    if (data){
                        data = JSON.parse(data);
                        /*if (data.length >= this.pagelength){
                            this.load_all(query, obj, callback, index+1, $.merge(docs, data));
                        } else {*/
                        this.ready[obj] = true;
                        this.rawdata[obj] = {};
                        this.rawdata[obj].docs = $.merge(docs, data);
                        this.load_data_callback(callback);
                        //}
                    } else {
                        this.ready[obj] = true;
                        this.rawdata[obj] = {};
                        this.rawdata[obj].docs = docs;
                        this.load_data_callback(callback);
                    }
                }, this/*, query, obj, callback, index, docs*/
            ),
        });
    },

    get_paper: function(url, callback){
        return callback(this.cache[url]);
    },

    async_load: function(callback){
        this.ready = {};
        this.aid = get_current_article();
        this.load_all('eprint:'+this.aid, 'base', callback, 0, []);
        this.load_all('refersto:eprint:'+this.aid, 'citations', callback, 0, []);
        this.load_all('citedby:eprint:'+this.aid, 'references', callback, 0, []);
    },

    sorters: {
        'paper': {'name': 'Paper order', 'func': function(i){return i.index;}},
        'citations': {'name': 'Citations', 'func': function(i){return i.citation_count;}},
        'influence': {'name': 'ADS read count', 'func': function(i){return i.read_count;}},
        'title': {'name': 'Title', 'func': function(i){return i.title.toLowerCase();}},
        'author': {'name': 'First author', 'func': function(i){return i.authors[0].name || '';}},
        'year': {'name': 'Year', 'func': function(i){return i.year;}}
    },
    sorters_order: ['citations', 'influence', 'title', 'author', 'year'],
    sorters_default: 'citations',
};
