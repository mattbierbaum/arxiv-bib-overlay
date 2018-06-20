// number of papers per page
var D = null;
var MAX_AUTHORS = 10;
var PAGE_LENGTH = 10;
var URL_ASSET_BASE = 'https://mattbierbaum.github.io/semantic-scholar-arxiv-overlay/';


//============================================================================
// origin S2 functionality
//============================================================================
function min(a, b){return (a < b) ? a : b;}
function max(a, b){return (a > b) ? a : b;}

function minor_to_major(category){
    // extract the major category from a full minor category
    var re = new RegExp(/([a-z\-]+)(:?\.[a-zA-Z\-]+)?/g);

    var match = re.exec(category);
    while (match != null)
        return match[1];
    return '';
}

function get_minor_categories(){
    // find the entries in the table which look like
    // (cat.MIN) -> (cs.DL, math.AS, astro-ph.GD)
    // also, (hep-th)
    var txt = $('.metatable').find('.subjects').text();
    var re = new RegExp(/\(([a-z\-]+(:?\.[a-zA-Z\-]+)?)\)/g);

    var matches = []
    var match = re.exec(txt);
    while (match != null){
        matches.push(match[1]);
        match = re.exec(txt);
    }
    return matches;
}

function get_categories(){
    var cats = get_minor_categories();

    var out = [];
    for (var i=0; i<cats.length; i++)
        out.push([minor_to_major(cats[i]), cats[i]]);
    return out;
}

function get_current_article(){
    var url = $(location).attr('href');
    var re_url = new RegExp(
        '^http(?:s)?://arxiv.org/abs/'+             // we are on an abs page
        '(?:'+                                           // begin OR group
          '(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+       // there is a new-form arxiv id
            '|'+                                            // OR
          '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+ // old-form id (not allowed by S2)
        ')'+                                             // end OR group
        '(?:#.*)?'+                                 // anchor links on page
        '(?:\\?.*)?$'                               // query parameter stuff
    );
    var match = re_url.exec(url);

    if (!match){
        console.log("No valid match could be found for article ID");
        return;
    }

    var aid = match.filter(function(x){return x;}).pop();

    if (aid.length <= 5){
        console.log("No valid article ID extracted from the browser location.");
        return;
    }

    return aid;
}

function asset_url(url){
    var output = '';
    try {
        output = chrome.extension.getURL(url);
    } catch (err) {
        output = URL_ASSET_BASE + url;
    }
    return output;
}

function encodeQueryData(data) {
    var ret = [];
    for (var d in data){
        key = d;
        val = data[d];

        if (!Array.isArray(val))
            val = [val]

        for (var i=0; i<val.length; i++)
            ret.push(
                encodeURIComponent(key) + '=' +
                encodeURIComponent(val[i])
            );
    }
    return ret.join('&');
}

var RE_IDENTIFIER = new RegExp(
    '(?:'+                                           // begin OR group
      '(?:arXiv:)?(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+   // there is a new-form arxiv id
        '|'+                                             // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+   // old-form id (not allowed by S2)
    ')'                                              // end OR group
);


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
    url_logo: asset_url('static/source-ads.png'),
    url_icon: asset_url('static/icon-ads.png'),

    shortname: 'ADS',
    categories: new Set([
        'astro-ph', 'cond-mat', 'gr-qc', 'hep-ex', 'hep-lat',
        'hep-ph', 'hep-th', 'math-ph', 'nlin', 'nucl-ex',
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
        'rows': 10000
    },

    ads_url_ui: 'https://ui.adsabs.harvard.edu/#search/',
    ads_url_part: function(field, value){
        return this.ads_url_ui + encodeQueryData({'q': field+':"'+value+'"'});
    },
    ads_url_author: function(name){return this.ads_url_part('author', name);},
    ads_url_title: function(name) {return this.ads_url_part('title', name);},
    ads_url_bibcode_search: function(bib){return this.ads_url_part('bibcode', bib);},
    ads_url_bibcode: function(bib){
        var url0 = 'https://ui.adsabs.harvard.edu/#abs/';
        var url1 = '/abstract';
        return url0 + bib + url1;
    },
    ads_url_arxiv: function(identifiers){
        if (!identifiers) return;

        for (var i=0; i<identifiers.length; i++){
            var match = RE_IDENTIFIER.exec(identifiers[i]);
            if (match) return 'https://arxiv.org/abs/'+(match[1] || match[2]);
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

        var output = []
        for (var i=0; i<auths.length; i++)
            output.push({
                'name': this.reverse_author(auths[i]),
                'url': this.ads_url_author(auths[i])
            });
        return output;
    },

    reformat_title: function(title){
        if (!title || title.length == 0)
            return 'Unknown';
        return title[0];
    },

    reformat_document: function(doc, index){
        var doc = {
            'title': this.reformat_title(doc.title),
            'authors': this.reformat_authors(doc.author),
            'api': this.ads_url_bibcode(doc.bibcode),
            'url': this.ads_url_bibcode(doc.bibcode),
            'arxiv_url': this.ads_url_arxiv(doc.identifier),
            'paperId': doc.bibcode || '',
            'year': doc.year || '',
            'venue': doc.pub || '',
            'doi': doc.doi || '',
            'identifier': doc.identifier || '',
            'citation_count': doc.citation_count,
            'read_count': doc.read_count,
            'index': index,
        };
        doc.searchline = this.searchline(doc);
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

    load_data_callback: function(callback) {
        if ('base' in this.ready && 'citations' in this.ready && 'references' in this.ready){
            if (this.rawdata.base.docs.length == 0)
                throw new Error("No data loaded for "+this.aid);

            var output = this.reformat_document(this.rawdata.base.docs[0]);
            output.citations = this.reformat_documents(this.rawdata.citations.docs);
            output.references = this.reformat_documents(this.rawdata.references.docs);

            output.citations.header = 'Citations';
            output.references.header = 'References';
            output.citations.header_url = output.url;
            output.references.header_url = output.url;
            output.citations.description = '';
            output.references.description = '';

            this.data = output;
            callback(this);
        }
    },

    load_data: function(query, obj, callback){
        this.api_params['q'] = query;

        if (obj in this.rawdata){
            this.ready[obj] = true;
            this.load_data_callback(callback);
            return;
        }

        var url = this.api_url+'?'+encodeQueryData(this.api_params);
        var auth = 'Bearer '+this.api_key;

        $.ajax({
            type: 'GET',
            url: url,
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
            failure: function(){throw new Error("Error accessing "+url);}
        });
    },

    get_paper: function(url, callback){
        return callback(this.cache[url]);
    },

    async_load: function(callback){
        this.ready = {};
        this.aid = get_current_article();
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


//============================================================================
// S2 specific transformations
//============================================================================
function S2Data() {
    this.cache = {};
    this.data = {}
    this.aid = null;
}

S2Data.prototype = {
    url_logo: asset_url('static/source-s2.png'),
    url_icon: asset_url('static/icon-s2.png'),

    shortname: 'S2',
    categories: new Set(['cs', 'stats.ML']),
    homepage: 'https://semanticscholar.org',
    api_url: 'https://api.semanticscholar.org/v1/',
    api_params: 'include_unknown_references=true',

    url_paper: function(id) {return this.api_url+'paper/arXiv:'+id+'?'+this.api_params;},
    url_paperId: function(id) {return this.api_url+'paper/'+id+'?'+this.api_params;},
    url_author: function(id) {return this.api_url+'author/'+id;},

    add_api_url: function(data){
        if ('paperId' in data)
            data['api'] = this.url_paperId(data['paperId']);
    },

    add_arxiv_url: function(data){
        if (data.venue == 'ArXiv'){
            var url = 'https://arxiv.org/search/?';
            var param = {
                'query': '"'+data.title+'"',
                'searchtype': 'title'
            };
            data['arxiv_url'] = url + encodeQueryData(param);
        }
        else
            data['arxiv_url'] = '';
    },

    searchline: function(doc){
        return [doc.title, doc.venue, doc.year].join(' ').toLowerCase();
    },

    reformat_document: function(data, index){
        this.add_api_url(data);
        this.add_arxiv_url(data);
        data.searchline = this.searchline(data);
        data.index = index;
    },

    transform_result: function(data){
        this.reformat_document(data);

        for (var ind in data.citations)
            this.reformat_document(data.citations[ind], ind);
        for (var ind in data.references)
            this.reformat_document(data.references[ind], ind);

        data.citations.header = 'Citations';
        data.references.header = 'References';
        data.citations.header_url = data.url + '#citingPapers';
        data.references.header_url = data.url + '#citedPapers';
        data.citations.description = 'highly influenced citations';
        data.references.description = 'highly influential references';
        return data;
    },

    async_load: function(callback){
        this.aid = get_current_article();
        var url = this.url_paper(this.aid);

        $.get(url, $.proxy(
            function(data){
               this.data = this.transform_result(data);
               this.cache[url] = this.data;
               callback(this);
            }, this)
        )
        .fail(function(err){})
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
    categories: new Set(['hep-th', 'hep-ex', 'hep-ph']),
    homepage: 'https://inspirehep.net',
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
        ],
        rg: '250',      // records in groups of
        //jrec: 250     // jump to record
    },

    url_paper: function(id) {return this.homepage+'/record/'+id;},
    url_paper_api: function(id) {return this.api_url+'?'+encodeQueryData({'p': 'recid:'+id, 'of': 'recjson'});},
    url_author: function(name, recid) {return this.homepage+'/author/profile/'+name+'?'+encodeQueryData({'recid': recid});},
    url_arxiv: function(arxivid){return arxivid ? 'https://arxiv.org/abs/'+arxivid : null;},

    doc_arxiv_id: function(doc){
        var reports = doc.primary_report_number;
        if (reports){
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

    reformat_document: function(doc, index){
        var arxivid = this.doc_arxiv_id(doc);
        var doc = {
            'title': this.doc_title(doc),
            'authors': this.doc_authors(doc),
            'year': this.doc_year(doc),
            'venue': this.doc_venue(doc),
            'doi': doc.doi || '',
            'citation_count': doc.number_of_citations,
            'recid': doc.recid.toString(),
            'paperId': doc.recid.toString(),
            'index': index,
            'api': this.url_paper_api(doc.recid.toString()),
            'url': this.url_paper(doc.recid),
            'arxiv_url': this.url_arxiv(arxivid),
        };
        doc.searchline = this.searchline(doc);
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
            output.citations.header_url = output.url;
            output.references.header_url = output.url;
            output.citations.description = '';
            output.references.description = '';

            this.data = output;
            callback(this);
        }
    },

    load_data: function(query, obj, callback){
        this.api_params['p'] = query;
        var url = this.api_url+'?'+encodeQueryData(this.api_params);

        if (obj in this.rawdata){
            this.ready[obj] = true;
            this.load_data_callback(callback);
            return;
        }

        $.ajax({
            type: 'GET',
            url: url,
            success: $.proxy(
                function(data){
                    this.ready[obj] = true;
                    this.rawdata[obj] = {};
                    this.rawdata[obj].docs = data;
                    this.load_data_callback(callback);
                }, this
            ),
            failure: function(){throw new Error("Error accessing "+url);}
        });
    },

    get_paper: function(url, callback){
        return callback(this.cache[url]);
    },

    async_load: function(callback){
        this.ready = {};
        this.aid = get_current_article();
        this.load_data(this.aid, 'base', callback);
        this.load_data('refersto:'+this.aid, 'citations', callback);
        this.load_data('citedby:'+this.aid, 'references', callback);
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

//============================================================================
// both at once now
//============================================================================
function random_id(){
    return new String(Math.random()).substring(2,12);
}

function makeDelay(callback, ms) {
    var timer = 0;
    return function(){
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
}

function ColumnView(ds, datakey, htmlid){
    this.ds = ds;
    this.htmlid = htmlid;
    this.data = ds.data[datakey];
    this.fdata = this.data;

    this.sort_field = ds.sorters_default;
    this.sort_order = 'up';
    this.filter_text = '';

    this.ids = {
        filter: random_id(),
        sorter: random_id(),
        header: random_id(),
        paging: random_id(),
        papers: random_id(),
        filter_val: random_id()
    };

    this.recalculate();
}

ColumnView.prototype = {
    recalculate: function(){
        this.recalculate_data();
        this.recalculate_pages();
    },

    recalculate_data: function(){
        this.fdata = this.filterfield(this.sortfield(this.data));
    },

    recalculate_pages: function(){
        this.npages = Math.floor((this.fdata.length-1) / PAGE_LENGTH) + 1;
        this.page = 1;
    },

    replace: function(id, element){$('#'+id).replaceWith(element);},
    replace_filter: function(){this.replace(this.ids.filter, this.create_filter());},
    replace_sorter: function(){this.replace(this.ids.sorter, this.create_sorter());},
    replace_paging: function(){this.replace(this.ids.paging, this.create_paging());},
    replace_papers: function(){this.replace(this.ids.papers, this.create_papers());},
    replace_header: function(){this.replace(this.ids.header, this.create_header());},

    /*=======================================
     * filter functions
     *=======================================*/
    change_filter: function(){
        this.filter_text = $('#'+this.ids.filter_val).val();
        this.recalculate();
        this.replace_header();
        this.replace_paging();
        this.replace_papers();
    },

    create_filter: function(){
        if (this.data.length <= 0)
            return $('<div>').addClass('bib-filter');

        var meta = this;
        var changer50 = makeDelay($.proxy(meta.change_filter, meta), 50);
        var changer250 = makeDelay($.proxy(meta.change_filter, meta), 250);

        var div = $('<div>')
            .addClass('bib-filter')
            .append(
                $('<span>')
                    .text('Filter: ')
                    .addClass('bib-filter-label')
            )
            .append(
                $('<input>')
                    .attr('type', 'search')
                    .attr('id', this.ids.filter_val)
                    .addClass('bib-filter-input')
                    .val(this.filter_text)
                    .on('search', changer50)
                    .on('keyup', changer250)
            );

        var container = $('<div>')
            .addClass('center')
            .attr('id', this.ids.filter)
            .append(div);

        return container;
    },

    /*=======================================
     * paging functions
     *=======================================*/
    change_page: function(n){
        this.page = parseInt(n);
        this.replace_paging();
        this.replace_papers();
    },

    create_paging: function(){
        /* This is a bit of a mess, but it basically ensures that the page list
         * looks visually uniform independent of the current page number. We want
         *   - always the same number of elements
         *   - always first / last pages, and prev / next
         *        < 1̲ 2 3 4 5 . 9 >
         *        < 1 2 3̲ 4 5 . 9 >
         *        < 1 2 3 4̲ 5 . 9 >
         *        < 1 . 4 5̲ 6 . 9 >
         *        < 1 . 5 6̲ 7 8 9 >
         * This makes the numbers easier to navigate and more visually appealing
        */
        var B = 1;              /* number of buffer pages on each side of current */
        var P = this.page;      /* shortcut to current page */
        var L = this.npages;    /* shortcut to total pages */
        var S = 2*B + 2*2 + 1;  /* number of total links in the pages sections:
                                   2*buffer + 2*(first number + dots) + current */

        var container = $('<div>').addClass('center').attr('id', this.ids.paging);

        var meta = this;
        if (this.data.length <= 0){
            container.append($('<span>').text('-'));
            return container;
        }

        var langle = '◀';
        var rangle = '▶';
        var dots = '...';

        function _nolink(txt, classname){
            classname = (classname === undefined) ? 'disabled' : classname;
            return $('<li>')
                .append(
                    $('<span>').html(txt).addClass(classname)
                );
        }

        function _link(n, txt){
            txt = (txt === undefined) ? n : txt;
            return $('<li>')
                .append($('<a>')
                    .html(txt)
                    .attr('href', 'javascript:;')
                    .click(function(){meta.change_page(n);})
                );
        }

        function _inclink(dir){
            /* << >> links, args: direction (-1, +1) */
            var txt = (dir < 0) ? langle : rangle;
            return ((P + dir < 1) || (P + dir > L)) ? _nolink(txt) : _link(P + dir, txt);
        }

        function _pagelink(n, active){
            /* num links, args: page number, whether to show dots */
            var active = (active === undefined) ? true : active;
            return !active ? _nolink(dots) : ((n == P) ? _nolink(n, 'bold') : _link(n));
        }

        var pages_text = $('<span>').text('Pages: ');
        var pages = $('<ul>').addClass('bib-page-list')

        pages.append(_inclink(-1));

        if (L <= S){
            // just show all numbers if the number of pages is less than the slots
            for (var i=1; i<=L; i++)
                pages.append(_pagelink(i));
        } else {
            // the first number (1) and dots if list too long
            pages.append(_pagelink(1));
            pages.append(_pagelink(2, P <= 1+2+B));

            // limit the beginning and end numbers to be appropriate ranges
            var i0 = min(L-2 - 2*B, max(1+2, P-B));
            var i1 = max(1+2 + 2*B, min(L-2, P+B));

            for (var i=i0; i<=i1; i++)
                pages.append(_pagelink(i));

            // the last number (-1) and dots if list too long
            pages.append(_pagelink(L-1, P >= L-2-B));
            pages.append(_pagelink(L-0));
        }

        pages.append(_inclink(+1));

        // create the dropdown as well for ease of navigating large lists
        var meta = this;
        var pager = function(){meta.change_page(this.value);};

        var select = $('<select>').on('change', pager);
        for (var i=1; i<=this.npages; i++)
            select.append($('<option>').attr('value', i).text(i));
        select.val(this.page);

        // finally decide if we should be showing nothing at all
        if (this.npages <= 1){
            pages_text = $('<span>').text('');
            pages = $('<ul>').addClass('bib-page-list');
            select = $('<span>');
        }

        container.append($('<span>')
            .append(pages_text)
            .append(pages)
            .append(select)
        );
        return container;
    },

    /*=======================================
     * sorting functions
     *=======================================*/
    change_sort: function(field, order){
        this.sort_field = field;
        this.sort_order = order;
        this.recalculate_data();
        this.replace_papers();
        this.replace_sorter();
    },

    create_sorter: function(){
        var meta = this;
        var sort_field_changer = function() {
            meta.change_sort(this.value, meta.sort_order);
        };

        var sort_order_toggle = function() {
            var order = (meta.sort_order == 'up') ? 'down' : 'up';
            meta.change_sort(meta.sort_field, order);
        };

        var sort_field = $('<select>')
            .attr('id', 'sort_field')
            .on('change', sort_field_changer)

        for (var i=0; i<this.ds.sorters_order.length; i++){
            var sid = this.ds.sorters_order[i];
            var sname = this.ds.sorters[sid].name;
            sort_field.append(
                $('<option>').attr('value', sid).text(sname)
            );
        }
        sort_field.val(this.sort_field);

        var up = this.sort_order == 'up';
        var sort_order = $('<span>')
            .addClass('sort-arrow')
            .addClass('sort-label')
            .append(
                $('<a>')
                .on('click', sort_order_toggle)
                .append(
                    $('<span>')
                        .addClass(up ? 'disabled' : '')
                        .attr('title', 'Sort ascending')
                        .text('▲')
                )
                .append(
                    $('<span>')
                        .addClass(up ? '' : 'disabled')
                        .attr('title', 'Sort descending')
                        .text('▼')
                )
            );

        var filters = $('<div>')
            .addClass('bib-sorter')
            .append($('<span>').text('Sort by: ').addClass('sort-label'))
            .append(sort_field)
            .append(sort_order);

        var container = $('<div>').addClass('center').attr('id', this.ids.sorter);
        if (this.data.length <= 0)
            container.append($('<span>'));
        else
            container.append($('<span>').append(filters));

        return container;
    },

    sortfield: function(data){
        var sorter = function(arr, field, ord){
            sign = (ord == 'up') ? 1 : -1;
            return arr.sort(function (a,b) {
                if (field(a) > field(b)) return -1*sign;
                if (field(a) < field(b)) return +1*sign;
                if (a.title  > b.title)  return +1;
                if (a.title  < b.title)  return -1;
                return 0;
            });
        }

        var func = this.ds.sorters[this.sort_field].func;
        output = sorter(data, func, this.sort_order);
        return output;
    },

    filterfield: function(data){
        if (this.filter_text.length == 0 || this.filter_text == '') return data;

        var output = [];
        var words = this.filter_text.split(' ');

        var output = data;
        for (var i=0; i<words.length; i++){
            var newlist = [];
            for (var j=0; j<output.length; j++){
                if (output[j].searchline.includes(words[i]))
                    newlist.push(output[j]);
            }
            output = newlist;
        }
        return output;
    },

    paper_line: function(ref){
        function titlecase(title) {
            return title.replace(/(?:\b)([a-zA-Z])/g, function(l){return l.toUpperCase();});
        }

        var make_link = {
            'ads': function(ref){return ref.url;},
            's2': function(ref){return ref.url;},
            'inspire': function(ref){return ref.url;},
            'arxiv': function(ref){return ref.arxiv_url;},
            'doi': function(ref){return 'https://doi.org/'+ref.doi;},
            'scholar': function(ref){
                return 'https://scholar.google.com/scholar?' + encodeQueryData({'q': ref.title});
            },
        };

        var make_text = {
            'ads': function(){return $('<span>').text('ADS').addClass('ads');},
            's2': function(){return $('<span>').text('S2').addClass('s2');},
            'inspire': function(){return $('<span>').text('Inspire').addClass('inspire');},
            'arxiv': function(){return $('<span>').text('arXiv').addClass('arxiv');},
            'doi': function(){return $('<span>').text('DOI').addClass('doi');},
            'scholar': function(){
                var colors = [
                    '#4484f4', // b
                    '#e94637', // r
                    '#fbbb00', // y
                    '#4484f4', // b
                    '#38a654', // g
                    '#e94637', // r
                    '#fbbb00', // y
                ];
                var chars = 'scholar'.split('');
                var out = $('<span>');

                for (var i=0; i<chars.length; i++){
                    out.append(
                        $('<span>')
                            .css('color', colors[i])
                            .text(chars[i])
                    );
                }
                return out;
            },
        };

        function _img(n){
            return $('<img>')
                .attr('src', asset_url('static/icon-'+n+'.png'))
                .css('height', '18')
                .css('width', 'auto')
        }

        var make_text = {
            'ads': function(){return _img('ads');},
            's2': function(){return _img('s2');},
            'inspire': function(){return _img('inspire');},
            'doi': function(){return _img('doi');},
            'arxiv': function(){return _img('arxiv');},
            'scholar': function(){return _img('scholar');},
        };

        var make_hover = {
            'ads': 'NASA ADS',
            's2': 'Semantic Scholar',
            'inspire': 'Inspire HEP',
            'doi': 'Journal article',
            'arxiv': 'ArXiv article',
            'scholar': 'Google Scholar',
        };

        function outbound_link(ref, style, newtab=true){
            var arrow = $('<span>').addClass('exitarrow').text('↳ ');
            var link = $('<a>')
                .addClass(name)
                .attr('title', make_hover[style])
                .attr('href', make_link[style](ref))
                .append(make_text[style]());

            if (newtab) link.attr('target', '_blank');

            return $('<span>')
                //.append(arrow)
                .append(link);
        }

        function outbound_links(ref){
            var arrow = $('<span>').addClass('exitarrow movearrow').text('↳ ');
            var urls = $('<div>').addClass('bib-outbound');

            urls.append(arrow);
            urls.append(outbound_link(ref, this.ds.shortname.toLowerCase()));

            if (ref.arxiv_url)
                urls.append(outbound_link(ref, 'arxiv', false));

            if (ref.doi)
                urls.append(outbound_link(ref, 'doi'));

            urls.append(outbound_link(ref, 'scholar'));
            return urls;
        }
        outbound_links = $.proxy(outbound_links, this);

        var known = (ref.paperId.length > 1);
        var classes = !known ? 'unknown' : (ref.isInfluential ? 'influential' : 'notinfluential');

        var paper = $('<div>')
            .addClass('bib-paper')
            .append(
                (known ? $('<a>') : $('<span>'))
                  .addClass(classes)
                  .addClass('mathjax')
                  .attr('href', ref.url)
                  .attr('target', '_blank')
                  .text(ref.title)
            )
            .append(
                $('<span>').addClass('jinfo')
                    .append($('<span>').addClass('venue').text(titlecase(ref.venue)))
                    .append($('<span>').addClass('year').text(ref.year))
            );

        if (known) {
            this.ds.get_paper(ref.api,
                $.proxy(function(data) {
                    var len = min(data.authors.length, MAX_AUTHORS);
                    var elem = $('<div>').addClass('bib-authors');

                    for (var j=0; j<len; j++){
                        $('<a>')
                            .appendTo(elem)
                            .attr('href', data.authors[j].url)
                            .attr('target', '_blank')
                            .text(data.authors[j].name);
                    }

                    if (len == MAX_AUTHORS)
                        elem.append(
                            $('<a>')
                                .text('...')
                                .attr('href', data.url)
                                .attr('target', '_blank')
                        );

                    paper.append(elem);
                    paper.append(outbound_links(data));
                }, paper),
                'Could not find paper "'+ref.title+'" via S2 API'
            );
        }

        return paper;
    },

    create_utilities: function(){
        return $('<div>')
            .addClass('bib-utils')
            .append(this.create_paging())
            .append(this.create_sorter())
            .append(this.create_filter());
    },

    create_header: function(){
        var desc = $('<span>')
                    .addClass('bib-col-center bib-col-aside')
                    .append($('<span>').css('color', 'black').text('('))
                    .append($('<span>').css('color', 'red').text('● '))
                    .append($('<span>').css('color', 'black').text(this.data.description+')'));

        var blank = $('<a>');

        var text = null;
        var text0 = this.data.header+' ('+this.data.length+')';
        var text1 = this.data.header+' ('+this.fdata.length+'/'+this.data.length+')';
        text = (this.data.length != this.fdata.length) ? text1 : text0;

        var header = $('<div>')
            .addClass('bib-col-header')
            .attr('id', this.ids.header)
            .append(
                $('<span>')
                    .addClass('bib-col-center')
                    .append(
                        $('<a>')
                            .addClass('bib-col-title')
                            .attr('href', this.data.header_url)
                            .attr('target', '_blank')
                            .text(text)
                    )
            )
            .append(this.data.description ? desc : blank);

        return header;
    },

    create_papers: function(){
        var papers = $('<div>').attr('id', this.ids.papers);

        var len = this.fdata.length;
        var start = PAGE_LENGTH * (this.page-1);
        for (var i=start; i<min(start+PAGE_LENGTH, len); i++)
            papers.append(this.paper_line(this.fdata[i]));

        return papers;
    },

    create_column: function(){
        var column = $('<div>')
            .addClass('bib-col')
            .attr('id', this.htmlid);

        column
            .append(this.create_header())
            .append(this.create_utilities())
            .append(this.create_papers());


        $('#'+this.htmlid).replaceWith(column);
        return column;
    },

    run_mathjax: function(){
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, $(this.htmlid)]);
    },
};

function Overlay(){}

Overlay.prototype = {
    id_references: 'col-references',
    id_citations: 'col-citations',

    create_data_option: function(){
        if (this.available.length <= 1)
            return null;

        var out = $('<div>')
            .addClass('bib-sidebar-source center')
            .append($('<span>').text('Data source:  '));

        for (var i=0; i<this.available.length; i++){
            var ds = this.available[i];
            var func = (function(ctx, s){
                return function(){
                    ctx.toggle_source(s);
                };
            })(this, ds);

            out.append(
                $('<img>')
                    .attr('src', ds.url_icon)
                    .on('click', func)
                    .addClass(ds.url_icon == this.ds.url_icon ? 'bib-selected' : 'bib-unselected')
            );
        }

        return out;
    },

    create_error: function(txt){
        if ($('.errors').length){
            $('.errors').append($('<p>').text(txt));
            return;
        }

        $('<div>')
            .addClass('delete')
            .addClass('bib-sidebar')
            .addClass('bib-sidebar-errors')
            .addClass('errors')
            .append($('<span>').addClass('bib-sidebar-error').text('Overlay error:'))
            .append($('<p>').text(txt))
            .insertBefore($('.bookmarks'));
    },

    create_sidebar: function(ds){
        var src = ds.url_icon;

        var badge = $('<span>')
            .append(
                $('<img>')
                    .addClass('bib-sidebar-badge')
                    .css('height', '24')
                    .css('width', 'auto')
                    .attr('src', src)
            )
            .append(
                $('<a>')
                    .addClass('bib-sidebar-title')
                    .text(ds.data.title.substring(0, 20) + '...')
                    .attr('href', ds.data.url)
                    .attr('target', '_blank')
            );

        var authorlist = $('<ul>').addClass('bib-sidebar-authors');

        for (var i=0; i<min(ds.data.authors.length, MAX_AUTHORS); i++){
            authorlist.append(
                $('<li>').append(
                    $('<a>')
                    .attr('href', ds.data.authors[i].url)
                    .attr('target', '_blank')
                    .text(ds.data.authors[i].name)
                )
            )
        }

        if (ds.data.authors.length > MAX_AUTHORS)
            authorlist.append($('<li>').append(
                $('<a>').text('...').attr('href', ds.data.url).attr('target', '_blank')
            ));

        $('<div>')
            .addClass('delete')
            .addClass('bib-sidebar')
            .append(badge)
            .append(authorlist)
            .append(this.create_data_option())
            .insertBefore($('.bookmarks'));
    },

    create_header: function(ds){
        var brand = $('<h1>')
            .addClass('bib-header')
            .append($('<span>').append(
                $('<a>').text('').attr('href', ds.homepage).attr('target', '_blank').append(
                    $('<img>').attr('src', ds.url_logo)
                )
            ));

        var columns = $('<div>')
            .addClass('bib-col2')
            .append($('<div>').attr('id', this.id_references))
            //.append($('<div>').addClass('bib-col-divider'))
            .append($('<div>').attr('id', this.id_citations));

        var thediv = $('<div>')
			.addClass('bib-main')
            .addClass('delete')
            .append(brand)
            .append(columns)
            .insertBefore($('.submission-history'));
    },

    create_overlay: function(ds){
        this.destroy_spinner();

        this.ds = ds;
        this.create_sidebar(ds);

        if (ds.data.references.length > 0 || ds.data.citations.length > 0){
            this.create_header(ds);

            this.column0 = new ColumnView(ds, 'references', this.id_references);
            this.column1 = new ColumnView(ds, 'citations', this.id_citations);
            this.column0.create_column();
            this.column1.create_column();
        }
    },

    create_spinner: function(){
        $('<div>')
            .addClass('bib-pulse-container')
            .append(
                $('<div>').addClass('bib-pulse')
                .append($('<div>'))
                .append($('<div>'))
                .append($('<div>'))
            )
            .insertBefore('.submission-history');
    },

    destroy_spinner: function(){
        $('.bib-pulse-container').remove()
    },

    bind_errors: function(o){
        var error = $.proxy(function(err){
            this.destroy_spinner();
            this.create_error(err.message);
            throw(err);
        }, this);

        wrap_object(o, error);
    },

    toggle_source: function(ds){
        $('.delete').remove();

        this.create_spinner();
        ds.async_load($.proxy(this.create_overlay, this));
    },

    load: function(ds){
        this.datasets = [new S2Data(), new InspireData(), new ADSData()];
        this.available = [];

        var cats = get_categories();
        if (!cats || cats.length == 0)
            return;

        var pcat = cats[0];
        for (var i=0; i<this.datasets.length; i++){
            if (this.datasets[i].categories.has(pcat[0]) ||
                this.datasets[i].categories.has(pcat[1])){
                this.available.push(this.datasets[i]);
            }
        }

        this.bind_errors(this);
        for (var i in this.available)
            this.bind_errors(this.available[i]);

        this.toggle_source(this.available[0]);
    }
};

function wrap_error(func, error) {
    if (!func._wrapped) {
        func._wrapped = function () {
            try {
                return func.apply(this, arguments);
            } catch(err) {
                error(err);
                throw err;
            }
        }
    }
    return func._wrapped;
};

function wrap_object(obj, error){
	for (var name in obj){
        if (typeof obj[name] == 'function'){
            obj[name] = wrap_error(obj[name], error);
        }
    }
}

function gogogo(){
    var ui = new Overlay();
    ui.load();
    D = ui;
}

gogogo();
