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

function get_categories(){
    // find the entries in the table which look like
    // (cat.MIN) -> (cs.DL, math.AS, astro-ph.GD)
    // also, (hep-th)
    var txt = $('.metatable').find('.subjects').text();
    var re = new RegExp(/\(([a-z\-]+)(:?\.[a-zA-Z\-]+)?\)/g);

    var matches = []
    var match = re.exec(txt);
    while (match != null){
        matches.push(match[1]);
        match = re.exec(txt);
    }
    return matches;
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
        'rows': 1000
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

    reformat_document: function(doc, index){
        var doc = {
            'title': doc.title[0],
            'authors': this.reformat_authors(doc.author),
            'api': this.ads_url_bibcode(doc.bibcode),
            'url': this.ads_url_bibcode(doc.bibcode),
            'arxiv_url': this.ads_url_arxiv(doc.identifier),
            'paperId': doc.bibcode,
            'year': doc.year,
            'venue': doc.pub,
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
            this.cache[d.url] = d;
            output.push(d);
        }
        return output;
    },

    load_data_callback: function(callback) {
        if ('base' in this.rawdata && 'citations' in this.rawdata && 'references' in this.rawdata){
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
                    this.rawdata[obj] = data.response;
                    this.load_data_callback(callback);
                }, this
            )
        });
    },

    get_paper: function(url, callback){
        return callback(this.cache[url]);
    },

    async_load: function(callback){
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
    categories: new Set(['cs']),
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
        );
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
        .fail(function(err) {
            console.log("Could not resolve "+url);
        });
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
// both at once now
//============================================================================
function external_link(elm){
    if (elm.tagName.toLowerCase() == 'a'){
        if (!elm.href.startsWith('https://arxiv.org'))
            elm.attr('target', '_blank');
    }
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

    this.npages = Math.floor((this.data.length-1) / PAGE_LENGTH) + 1;
    this.page = 1;

    this.sort_field = ds.sorters_default;
    this.sort_order = 'up';

    this.filter_id = btoa(Math.random()).substring(0,12);
    this.filter_text = '';
}

ColumnView.prototype = {
    change_filter: function(){
        this.filter_text = $('#'+this.filter_id).val();
        this.create_column();
        $('#'+this.filter_id).focus();
    },

    create_filter: function(){
        var meta = this;
        var changer = makeDelay($.proxy(meta.change_filter, meta), 250);

        var div = $('<div>')
            .addClass('bib-filter')
            .append(
                $('<span>')
                    .text('Filter: ')
                    .addClass('bib-filter-label')
            )
            .append(
                $('<input>')
                    .attr('type', 'text')
                    .attr('id', this.filter_id)
                    .addClass('bib-filter-input')
                    .keyup(changer)
                    .val(this.filter_text)
            );

        return div;
    },

    change_page: function(n){
        this.page = parseInt(n);
        return this.create_column();
    },

    create_pagination: function(){
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

        var meta = this;
        if (this.data.length <= 0)
            return $('<span>').text('-')

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
        var pages = $('<ul>').addClass('page-list')

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
            pages = $('<ul>').addClass('page-list');
            select = $('<span>');
        }

        return $('<span>')
            .append(pages_text)
            .append(pages)
            .append(select);
    },

    change_sort: function(field, order){
        this.sort_field = field;
        this.sort_order = order;
        return this.create_column();
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
            .append(sort_order)

        if (this.data.length <= 0)
            return $('<span>');
        return $('<span>').append(filters);
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

        output = [];
        for (var i=0; i<data.length; i++){
            if (data[i].searchline.includes(this.filter_text))
                output.push(data[i]);
        }
        return output
    },

    paper_line: function(ref){
        function titlecase(title) {
            return title.replace(/(?:\b)([a-zA-Z])/g, function(l){return l.toUpperCase();});
        }

        var make_link = {
            'ads': function(ref){return ref.url;},
            's2': function(ref){return ref.url;},
            'arxiv': function(ref){return ref.arxiv_url;},
            'doi': function(ref){return 'https://doi.org/'+ref.doi;},
            'scholar': function(ref){
                return 'https://scholar.google.com/scholar?' + encodeQueryData({'q': ref.title});
            },
        };

        var make_text = {
            'ads': function(){return $('<span>').text('ADS').addClass('ads');},
            's2': function(){return $('<span>').text('S2').addClass('s2');},
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
            'doi': function(){return _img('doi');},
            'arxiv': function(){return _img('arxiv');},
            'scholar': function(){return _img('scholar');},
        };

        var make_hover = {
            'ads': 'NASA ADS',
            's2': 'Semantic Scholar',
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
            .addClass('page')
            .append($('<div>').addClass('center').append(this.create_pagination()))
            .append($('<div>').addClass('center').append(this.create_sorter()))
            .append($('<div>').addClass('center').append(this.create_filter()))
    },

    create_column: function(){
        var references = this.filterfield(this.sortfield(this.data));
        var column = $('<div>').addClass('bib-col').attr('id', this.htmlid);

        // create the header with the branding and explanation of red dots
        var brandid = Math.random().toString(36).substring(7);

        var desc = $('<span>')
                    .addClass('bib-col-center bib-col-aside')
                    .append($('<span>').css('color', 'black').text('('))
                    .append($('<span>').css('color', 'red').text('● '))
                    .append($('<span>').css('color', 'black').text(this.data.description+')'));

        var blank = $('<a>');

        // header business (title, subtitle, branding)
        var header = $('<div>')
            .addClass('bib-col-header')
            .append(
                $('<span>')
                    .addClass('bib-col-center')
                    .attr('id', brandid)
                    .append(
                        $('<a>')
                            .addClass('bib-col-title')
                            .attr('href', this.data.header_url)
                            .attr('target', '_blank')
                            .text(this.data.header+" ("+references.length+")")
                    )
            )
            .append(this.data.description ? desc : blank)
            .append(this.create_utilities())
            .appendTo(column)


        // inject the papers with authors into the column
        var len = references.length;
        var start = PAGE_LENGTH * (this.page-1);
        for (var i=start; i<min(start+PAGE_LENGTH, len); i++)
            column.append(this.paper_line(references[i]));

        $('#'+this.htmlid).replaceWith(column);
        return column;
    },
};

function Overlay(){}

Overlay.prototype = {
    id_references: 'col-references',
    id_citations: 'col-citations',

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

    load: function(ds){
        this.create_spinner();
        ds.async_load($.proxy(this.create_overlay, this));
    }
};

function gogogo(){
    var ds, ui;
    var datasets = [new S2Data(), new ADSData()];

    var cats = get_categories();
    if (!cats || cats.length == 0)
        return;

    for (var i=0; i<datasets.length; i++){
        if (datasets[i].categories.has(cats[0]))
            ds = datasets[i];
    }

    if (ds){
        ui = new Overlay();
        ui.load(ds);
        D = ui;
    }
}

gogogo();
