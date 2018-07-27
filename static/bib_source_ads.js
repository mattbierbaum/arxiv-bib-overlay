//============================================================================
// ADS specific transformations
//============================================================================
function ADSData() {
    this.ready = {};
    this.rawdata = {};
    this.cache = {};
    this.data = {};
    this.aid = null;
}

ADSData.prototype = {
    url_logo: bib_lib.asset_url('static/source-ads.png'),
    url_icon: bib_lib.asset_url('static/icon-ads.png'),

    shortname: 'ADS',
    longname: 'NASA ADS',
    categories: new Set([
        'astro-ph', 'cond-mat', 'gr-qc', 'hep-ex', 'hep-lat',
        'hep-ph', 'hep-th', 'nlin', 'nucl-ex',
        'nucl-th', 'physics', 'quant-ph'
    ]),
    homepage: 'https://ui.adsabs.harvard.edu',
    api_url: 'https://api.adsabs.harvard.edu/v1/search/query',
    api_key: '3vgYvCGHUS12SsrgoIfbPhTHcULZCByH8pLODY1x',
    api_params: {
        'fl': [
            'id', 'pub', 'bibcode', 'title', 'author', 'bibstem',
            'year', 'doi', 'citation_count', 'read_count', 'identifier'
        ],
        'rows': bib_lib.API_ARTICLE_COUNT,
        'sort': 'citation_count desc',
    },

    ads_url_ui: 'https://ui.adsabs.harvard.edu/#search/',
    ads_url_part: function(field, value){
        return this.ads_url_ui + bib_lib.encodeQueryData({'q': field+':"'+value+'"'});
    },
    ads_url_author: function(name){return this.ads_url_part('author', name);},
    ads_url_title: function(name) {return this.ads_url_part('title', name);},
    ads_url_bibcode_search: function(bib){return this.ads_url_part('bibcode', bib);},
    ads_url_bibcode: function(bib){
        return 'https://ui.adsabs.harvard.edu/#abs/' + bib;
    },
    ads_url_arxiv: function(identifiers){
        var eprint = this.get_eprint(identifiers);
        if (eprint)
            return 'https://arxiv.org/abs/'+eprint;
        return;
    },

    ads_url_doi: function(doc){
        if (!doc.doi) return '';
        return this.homepage+'/link_gateway/'+doc.bibcode+'/doi:'+doc.doi;
    },

    get_eprint: function(identifiers){
        if (!identifiers) return;

        for (var i=0; i<identifiers.length; i++){
            var match = bib_lib.RE_IDENTIFIER.exec(identifiers[i]);
            if (match) return (match[1] || match[2] || match[3]);
        }
        return;
    },

    searchline: function(doc){
        var auths = '';
        for (var i=0; i<doc.authors.length; i++){
            auths += doc.authors[i].name + ' ';
        }
        return [doc.title, auths, doc.venue, doc.year].join(' ').toLowerCase();
    },

    reverse_author: function(name){
        if (!name) return 'Unknown';
        return name.split(', ').reverse().join(' ');
    },

    reformat_authors: function(auths){
        if (!auths) return [];

        var output = [];
        for (var i=0; i<auths.length; i++)
            output.push({
                'name': this.reverse_author(auths[i]),
                'url': this.ads_url_author(auths[i])
            });
        return output;
    },

    reformat_title: function(title){
        if (!title || title.length === 0)
            return 'Unknown';
        return title[0];
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

    reformat_document: function(doc, index){
        var newdoc = {
            'title': this.reformat_title(doc.title),
            'authors': this.reformat_authors(doc.author),
            'api': this.ads_url_bibcode(doc.bibcode),
            'url': this.ads_url_bibcode(doc.bibcode),
            'url_arxiv': this.ads_url_arxiv(doc.identifier),
            'url_doi': this.ads_url_doi(doc),
            'arxivid': this.get_eprint(doc.identifier),
            'doi': (doc.doi || [''])[0],
            'paperId': doc.bibcode || '',
            'year': doc.year || '',
            'venue': doc.pub || '',
            'identifier': doc.identifier || '',
            'citation_count': doc.citation_count,
            'read_count': doc.read_count,
            'index': index,
        };
        newdoc.searchline = this.searchline(newdoc);
        newdoc.outbound = this.outbound_names(newdoc);
        return newdoc;
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

    load_data_callback: function(callback) {
        if ('base' in this.ready && 'citations' in this.ready && 'references' in this.ready){
            if (this.rawdata.base.docs.length === 0)
                throw new Error("No data loaded for "+this.aid);

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

    load_data: function(query, obj, callback){
        this.api_params.q = query;

        if (obj in this.rawdata){
            this.ready[obj] = true;
            this.load_data_callback(callback);
            return;
        }

        var url = this.api_url+'?'+bib_lib.encodeQueryData(this.api_params);
        var auth = 'Bearer '+this.api_key;

        $.ajax({
            type: 'GET',
            async: true,
            timeout: bib_lib.API_TIMEOUT,
            url: bib_lib.urlproxy(url),
            beforeSend: function(xhr){
                xhr.setRequestHeader('Authorization', auth);
            },
            success: $.proxy(
                function(data){
                    this.ready[obj] = true;
                    this.rawdata[obj] = data.response;
                    this.load_data_callback(callback);
                }, this
            ),
            error: this.query_error,
        });
    },

    get_paper: function(url, callback){
        return callback(this.cache[url]);
    },

    async_load: function(callback){
        this.ready = {};
        this.aid = bib_lib.get_current_article();
        this.load_data('arXiv:'+this.aid, 'base', callback);
        this.load_data('citations(arXiv:'+this.aid+')', 'citations', callback);
        this.load_data('references(arXiv:'+this.aid+')', 'references', callback);
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
