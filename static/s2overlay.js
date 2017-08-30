// https://arxiv.org/abs/1705.10311

var cache = {};
var metaleft, metaright;

// number of papers per page
var PAGE_LENGTH = 10;

var URL_LOGO = 'https://s3.amazonaws.com/public.runat.me/s2overlay/s2.png';
try {
    URL_LOGO = chrome.extension.getURL('static/s2.png');
} catch(err) {
    console.log('We are not an extension right now.');
}

var URL_S2_HOME = 'https://semanticscholar.org';
var URL_S2_API = 'https://api.semanticscholar.org/v1/';

function min(a, b){return (a < b) ? a : b;}
function max(a, b){return (a > b) ? a : b;}

function url_s2_paper(id)   {return URL_S2_API+'paper/arXiv:'+id;}
function url_s2_paperId(id) {return URL_S2_API+'paper/'+id;}
function url_s2_author(id)  {return URL_S2_API+'author/'+id;}

function get_category(){
    var cat = '';
    $("#header a").each(function (){
        if (this.href.indexOf('/list/') > 0)
            cat = this.text;
    });
    return cat;
}

function myfail(msg, doalert){
    if (typeof(doalert)==='undefined') doalert = false;

    console.log(msg);
    if (doalert) alert(msg);
    throw new Error(msg);
}

function current_article(){
    var url = $(location).attr('href');
    var re_url = new RegExp(
        '^http(?:s)?://arxiv.org/abs/'+             // we are on an abs page
        //'(?:'+                                            // begin OR group
            '(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+        // there is a new-form arxiv id
        //    '|'+                                          // OR
        //  '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+  // old-form id (not allowed by S2)
        //')'+                                              // end OR group
        '(?:\\?.*)?$'                               // query parameter stuff
    );
    var match = re_url.exec(url);

    if (!match) return '';
    return match.filter(function(x){return x;}).pop();
}

function is_overlay_loaded(){
    if (typeof _s2overlayed !== 'undefined')
        return true;
    _s2overlayed = true;
    return false;
}

function load_data(url, callback, failmsg){
    if (url in cache)
        return callback(cache[url]);

    $.get(url, function(data){
        cache[url] = data;
        callback(data);
     })
     .fail(function(err) {
         myfail(failmsg, false);
     });
}

function gogogo(){
    if (is_overlay_loaded()){
        console.log("Overlay has already been loaded once, skipping.");
        return;
    }

    if (get_category() != 'cs'){
        console.log("Category does not match 'cs'.");
        return;
    }

    var articleid = current_article();

    if (!articleid || articleid.length <= 5){
        console.log("No valid article ID extracted from the browser location.");
        return;
    }

    load_data(
        url_s2_paper(articleid), load_overlay,
        'S2 API -- article could not be found.'
    );
}

function replace_author_links(authors){
    var auths = $('div.authors a');

    for (var i=0; i<auths.length; i++){
        $(auths[i])
            .attr('href', authors[i].url)
            .text(authors[i].name);
    }
}

function titlecase(title) {
    return title.replace(/(?:\b)([a-zA-Z])/g, function(l){return l.toUpperCase();});
}

function paper_line(ref){
    var classes = ref.isInfluential ? 'influential' : 'notinfluential';

    var paper = $('<div>')
        .addClass('s2-paper')
        .append(
            $('<a>')
              .addClass(classes)
              .attr('href', ref.url)
              .text(ref.title)
        )
        .append(
            $('<span>').addClass('jinfo')
                .append($('<span>').addClass('venue').text(titlecase(ref.venue)))
                .append($('<span>').addClass('year').text(ref.year))
        );

    var url = url_s2_paperId(ref.paperId);
    load_data(url,
        function(data) {
            var len = data.authors.length;
            var elem = $('<div>').addClass('s2-authors');

            for (var j=0; j<len; j++){
                $('<a>')
                    .appendTo(elem)
                    .attr('href', data.authors[j].url)
                    .text(data.authors[j].name);
            }

            paper.append(elem);
        },
        'Could not find paper "'+ref.title+'" via S2 API'
    );

    return paper;
}

function change_page(id, n){
    var meta = (id == metaleft.identifier) ? metaleft : metaright;
    meta.page = parseInt(n);
    return create_column(meta);
}

function create_pagination(meta){
    var langle = '&laquo;';
    var rangle = '&raquo;';
    var dots = '...';

    function _nolink(txt, classname){
        classname = typeof classname !== 'undefined' ? classname : 'disabled';
        return $('<li>').append($('<span>').html(txt).addClass(classname));
    }

    function _link(txt, n, bold){
        var link = $('<a>')
                    .attr('href', 'javascript:;')
                    .click(function (){ change_page(meta.identifier, n); })
                    .html(txt)
        return $('<li>').append(link);
    }

    var pages_text = $('<span>').text('Pages: ');
    var pages = $('<ul>').addClass('page-list')

    pages.append((meta.page == 0) ? _nolink(langle) : _link(langle, meta.page-1));

    var BUFF = 2;
    var bufferl = Math.max(0, meta.page-BUFF);
    var bufferr = Math.min(meta.npages-1, meta.page+BUFF);

    if (bufferl >= BUFF-1) pages.append(_link(1, 0));
    if (bufferl >= BUFF)   pages.append(_nolink(dots));

    for (var i=bufferl; i<=bufferr; i++)
        pages.append((i == meta.page) ? _nolink(i+1, 'bold') : _link(i+1, i));

    if (bufferr < meta.npages-BUFF)      pages.append(_nolink(dots));
    if (bufferr < meta.npages-(BUFF-1))  pages.append(_link(meta.npages, meta.npages-1));

    if (meta.page >= meta.npages-1)
        pages.append(_nolink(rangle));
    else
        pages.append(_link(rangle, meta.page+1));

    // create the dropdown as well for ease of navigating large lists
    var select = $('<select>')
        .on('change', function (){
            change_page(meta.identifier, this.value);
        });

    for (var i=0; i<meta.npages; i++)
        select.append(
            $('<option>')
                .attr('value', i)
                .text(i+1)
        );

    select.val(meta.page);

    var sort_field_changer = function(dir) {
        var elm = $('#'+meta.htmlid);
        change_sort(meta.identifier, elm.find('#sort_field')[0].value, meta.sort_order);
    };

    var sort_order_changer = function(dir) {
        change_sort(meta.identifier, meta.sort_field, dir);
    };

    var sort_field = $('<select>')
        .attr('id', 'sort_field')
        .append($('<option>').attr('value', 'influence').text('Influence'))
        .append($('<option>').attr('value', 'title').text('Title'))
        //.append($('<option>').attr('value', 'author').text('Author'))
        .append($('<option>').attr('value', 'year').text('Year'))
        //.append($('<option>').attr('value', 'citations').text('Citations'))
        .on('change', sort_field_changer)
        .val(meta.sort_field);

    var sort_order = $('<span>')
        .addClass('sort-arrow')
        .append(
            (meta.sort_order == 'up') ?
                $('<span>').text('▲').addClass('disabled') :
                $('<a>').text('▲').on('click', function() {sort_order_changer('up');})
        ) 
        .append(
            (meta.sort_order == 'down') ?
                $('<span>').text('▼').addClass('disabled') :
                $('<a>').text('▼').on('click', function() {sort_order_changer('down');})
        );

    var filters = $('<span>')
        .append($('<span>').text('Sort by: ').addClass('sortlabel'))
        .append(sort_field)
        .append($('<span>').text('Order: ').addClass('sortlabel'))
        .append(sort_order)

    if (meta.npages <= 1){
        pages_text = $('<span>').text('');
        pages = $('<ul>').addClass('page-list');
        select = $('<span>');
    }
    if (meta.length <= 0){
        pages_text = $('<span>').text('-');
        filters = $('<span>');
    }

    filters = $('<div>').append(filters);

    return $('<div>')
        .addClass('page')
        .append(pages_text)
        .append(pages)
        .append(select)
        .append(filters)
}

function change_sort(id, sortfield, sortorder){
    var meta = (id == metaleft.identifier) ? metaleft : metaright;
    meta.sort_field = sortfield;
    meta.sort_order = sortorder;
    return create_column(meta);
}

function sorter(arr, field){
    return arr.sort(function (a,b) {
        return (field(a) > field(b)) ? -1 : ((field(a) < field(b)) ? 1 : 0);
    });
}

function influential_to_top(references){
    var newlist = [];

    for (var i=0; i<references.length; i++){
        if (references[i].isInfluential)
            newlist.push(references[i]);
    }
    for (var i=0; i<references.length; i++){
        if (!references[i].isInfluential)
            newlist.push(references[i]);
    }

    return newlist;
}

function sortfield(refs, sortfield, sortorder){
    var sort_funcs = {
        'influence': function (d) {return influential_to_top(d).reverse();},
        'title': function (d) {return sorter(d, function(i){return i.title.toLowerCase();});},
        'author': function (d) {return sorter(d, function(i){return i.authors[0].name || '';});},
        'year': function (d) {return sorter(d, function(i){return i.year;});},
        'citations': function (d) {return sorter(d, function(i){return i.citations.length;});}
    }

    output = sort_funcs[sortfield](refs);
    if (sortorder == 'up')
        return output.reverse();
    return output;
}

function create_column(meta){
    var references = meta.data[meta.identifier];
    references = sortfield(references, meta.sort_field, meta.sort_order);

    var column = $('<div>').addClass('s2-col').attr('id', meta.htmlid);

    // create the header with the branding and explanation of red dots
    var brandid = Math.random().toString(36).substring(7);

    // header business (title, subtitle, branding)
    var header = $('<div>')
        .addClass('s2-col-header')
        .append(
            $('<span>')
                .addClass('s2-col-center')
                .attr('id', brandid)
                .append(
                    $('<a>')
                        .addClass('s2-col-title')
                        .attr('href', meta.data.url+meta.s2anchor)
                        .text(meta.title+" ("+references.length+")")
                )
        )
        .append(
            $('<span>')
                .addClass('s2-col-center s2-col-aside')
                .append($('<span>').css('color', 'black').text('('))
                .append($('<span>').css('color', 'red').text('● '))
                .append($('<span>').css('color', 'black').text(meta.description+')'))
        )
        .append(create_pagination(meta))
        .appendTo(column)


    // inject the papers with authors into the column
    var len = references.length;
    var start = PAGE_LENGTH * meta.page;
    for (var i=start; i<min(start+PAGE_LENGTH, len); i++)
        column.append(paper_line(references[i]));

    $('#'+meta.htmlid).replaceWith(column);
    return column;
}

function load_overlay(data){
    metaleft = {
        title: 'References',
        identifier: 'references',
        s2anchor: '#citedPapers',
        description: 'highly influential references',
        htmlid: 'col-references',
        npages: Math.floor((data.references.length-1) / PAGE_LENGTH)+1,
        page: 0,
        data: data,
        length: data.references.length,
        sort_field: 'influence',
        sort_order: 'up'
    };
    metaright = {
        title: 'Citations',
        identifier: 'citations',
        s2anchor: '#citingPapers',
        description: 'highly influenced citations',
        htmlid: 'col-citations',
        npages: Math.floor(data.citations.length / PAGE_LENGTH)+1,
        page: 0,
        data: data,
        length: data.citations.length,
        sort_field: 'influence',
        sort_order: 'up'
    };

	var brand = $('<h1>')
        .insertBefore($('.submission-history'))
		.addClass('s2 lined')
	    .append(
            $('<span>').append(
                $('<a>').attr('href', 'https://semanticscholar.org').append(
                    $('<img>').attr('src', URL_LOGO)
                )
            )
        );

    var thediv = $('<div>')
        .insertBefore($('.submission-history'))
        .addClass('s2-col2')
        .append($('<div>').attr('id', metaleft.htmlid))
        .append($('<div>').attr('id', metaright.htmlid));

    create_column(metaleft);
    create_column(metaright);
    replace_author_links(data.authors);
}

gogogo();
