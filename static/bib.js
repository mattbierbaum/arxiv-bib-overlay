// number of papers per page
var D = null;
var MAX_AUTHORS = 10;
var PAGE_LENGTH = 10;

function outbound_links(ref, ignore=[]){
    var make_link = {
        'ads': function(ref){return ref.url;},
        's2': function(ref){return ref.url;},
        'inspire': function(ref){return ref.url;},
        'arxiv': function(ref){return ref.url_arxiv;},
        'doi': function(ref){return ref.url_doi;},
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

    function outbound_link(ref, style){
        var arrow = $('<span>').addClass('exitarrow').text('↳ ');
        var link = $('<a>')
            .addClass(name)
            .attr('title', make_hover[style])
            .attr('href', make_link[style](ref))
            .append(make_text[style]());

        if (style != 'arxiv') link.attr('target', '_blank');

        return $('<span>').append(link);
    }

    var arrow = $('<span>').addClass('exitarrow movearrow').text('↳ ');
    var urls = $('<div>').addClass('bib-outbound');

    urls.append(arrow);

    ignore = new Set(ignore);
    for (var i=0; i<ref.outbound.length; i++)
        if (!ignore.has(ref.outbound[i]))
            urls.append(outbound_link(ref, ref.outbound[i]));
    return urls;
}

//============================================================================
// Column elements (one for citations, one for references)
//============================================================================
function ColumnView(ds, datakey, htmlid){
    this.ds = ds;
    this.htmlid = htmlid;
    this.data = ds.data[datakey];
    this.length = ds.data[datakey].count;
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
        var words = this.filter_text.toLowerCase().split(' ');

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

        var known = (ref.paperId.length > 1);
        var classes = !known ? 'unknown' : (ref.isInfluential ? 'influential' : 'notinfluential');
        var cite_text = ref.citation_count ? '(citations: '+ref.citation_count+')' : '';

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
                    .append($('<span>').addClass('citations').text(cite_text))
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
        var star = $('<a>')
                        .addClass('bib-col-title')
                        .text('*')
                        .attr('title',
                                'Only displaying the '+API_ARTICLE_COUNT+' most cited articles. '+
                                'For all articles, follow this link to '+this.ds.longname+'.')
                        .attr('href', this.data.header_url)
                        .attr('target', '_blank')
                        .css('color', 'red')
                        .css('font-size', '24px');

        var desc = $('<span>')
                    .addClass('bib-col-center bib-col-aside')
                    .append($('<span>').css('color', 'black').text('('))
                    .append($('<span>').css('color', 'red').text('● '))
                    .append($('<span>').css('color', 'black').text(this.data.description+')'));

        var blank = $('<a>');

        var text = null;
        var text0 = this.data.header+' ('+this.data.length+')';
        var text1 = this.data.header+' ('+this.fdata.length+'/'+this.length+')';
        text = (this.length != this.fdata.length) ? text1 : text0;
        foot = (this.data.length == API_ARTICLE_COUNT) ? star : null;

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
                    .append(foot)
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

//============================================================================
// The overall layout of the overlay
//============================================================================
function Overlay(){}

Overlay.prototype = {
    id_references: 'col-references',
    id_citations: 'col-citations',

    create_sidebar: function(){
        $('<div>')
            .addClass('delete')
            .addClass('bib-sidebar')
            .append($('<div>').addClass('bib-sidebar-paper nodisplay'))
            .append($('<div>').addClass('bib-sidebar-errors nodisplay'))
            .append($('<div>').addClass('bib-sidebar-source nodisplay'))
            .insertBefore($('.bookmarks'));
    },

    populate_source: function(){
        if (this.available.length == 0)
            return null;

        var out = $('<div>')
            .addClass('bib-sidebar-source')
            .append($('<span>').text('Data source:  '));

        for (var i=0; i<this.available.length; i++){
            var ds = this.available[i];
            var func = (function(ctx, s){
                return function(){
                    ctx.toggle_source(s);
                };
            })(this, ds.shortname);

            out.append(
                $('<img>')
                    .attr('src', ds.url_icon)
                    .attr('title', ds.shortname)
                    .on('click', func)
                    .addClass(ds.url_icon == this.ds.url_icon ? 'bib-selected' : 'bib-unselected')
            );
        }

        $('.bib-sidebar-source').replaceWith(out);
        $('.bib-sidebar-source').css('display', 'flex');
    },

    populate_error: function(txt){
        function err2div(txt){
            if (txt.length <= 30)
                $('.errors').append($('<li>').addClass('error').text(txt));
            else {
                $('.errors').append(
                    $('<li>')
                        .addClass('error')
                        .text(txt.substring(0,27) + '...')
                        .append($('<pre>').text(txt).addClass('hover'))
                );
            }
        }

        if ($('.errors').length){
            err2div(txt);
            return;
        }

        $('.bib-sidebar-errors').replaceWith(
            $('<div>')
                .addClass('bib-sidebar-errors')
                .append($('<span>').addClass('bib-sidebar-error').text('Overlay error:'))
                .append($('<ul>').addClass('errors'))
        );
        $('.bib-sidebar-errors').css('display', 'block');
        $('.bib-sidebar-source').addClass('topborder');
        err2div(txt);
    },

    populate_sidebar: function(ds){
        var src = ds.url_icon;

        var badge = $('<div>')
            .addClass('bib-sidebar-title')
            .append($('<span>')
                /*.append(
                    $('<img>')
                        .addClass('bib-sidebar-badge')
                        .css('height', '24')
                        .css('width', 'auto')
                        .attr('src', src)
                )*/
                .append(
                    $('<a>')
                        .addClass('bib-sidebar-title-link')
                        .text(ds.data.title.substring(0, 20) + '...')
                        .attr('href', ds.data.url)
                        .attr('target', '_blank')
                )
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

        var outbounds = outbound_links(ds.data, ['arxiv']);

        var output = $('<div>')
            .addClass('bib-sidebar-paper')
            .append(badge)
            .append(authorlist)
            .append(outbounds);

        $('.bib-sidebar-paper').replaceWith(output)
        $('.bib-sidebar-paper').css('display', 'block');
        $('.bib-sidebar-source').addClass('topborder');
    },

    create_main: function(ds){
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
        this.populate_source();
        this.populate_sidebar(ds);

        if (ds.data.references.length > 0 || ds.data.citations.length > 0){
            this.create_main(ds);

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
            this.populate_error(err.message);
            throw(err);
        }, this);

        wrap_object(o, error);
    },

    sync_key: function(cat){
        return 'default:'+cat;
    },

    load_default_source: function(){
        var pcat = get_categories()[0][0];
        var key = this.sync_key(pcat);

        chrome.storage.local.get(key,
            $.proxy(function(items){
                if (!chrome.runtime.error) {
                    var name = '';
                    for (var key in items)
                        name = items[key];

                    if (name)
                        this.toggle_source(name);
                    else
                        this.toggle_source(this.available[0].shortname);

                } else {
                    console.log(chrome.runtime.error);
                }
            }, this)
        );
    },

    save_default_source: function(){
        var pcat = get_categories()[0][0];

        var data = {};
        data[this.sync_key(pcat)] = this.ds.shortname;

        chrome.storage.local.set(data, function() {
            if (chrome.runtime.error)
                throw new OverlayException('Syncing category defaults failed: '+chrome.runtime.error);
        });
    },

    toggle_source: function(name){
        $('.delete').remove();

        this.ds = this.get_dataset(name);
        this.create_spinner();
        this.create_sidebar();
        this.populate_source();
        this.save_default_source();
        this.ds.async_load($.proxy(this.create_overlay, this));
    },

    get_dataset: function(name){
        for (var i=0; i<this.available.length; i++){
            if (this.available[i].shortname == name)
                return this.available[i];
        }
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

        if (this.available.length > 0){
            this.load_default_source();
        }
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
    obj.error_wrapper = function(){
        return function(func){
            return wrap_error(func, error);
        };
    }();
}

function gogogo(){
    var ui = new Overlay();
    ui.load();
    D = ui;
}

gogogo();
