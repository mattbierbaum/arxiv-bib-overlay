// https://arxiv.org/abs/1705.10311

var gdata;
var cache = {};
var metaleft, metaright;

// number of papers per page and 
// number of crumbs on each side of the central page (1 ... 5 6 7 ... 10) = 1
var PAGE_LENGTH = 3;
var PAGE_CENTRAL_CRUMBS = 1;

//var URL_LOGO = 'http://127.0.0.1:8000/static/s2logo.png';
var URL_LOGO = chrome.extension.getURL('static/s2logo.png');
var URL_S2_HOME = 'https://semanticscholar.org';
var URL_S2_API = 'http://api.semanticscholar.org/v1/';

function min(a, b){return (a < b) ? a : b;}
function max(a, b){return (a > b) ? a : b;}

function url_s2_paper(id)   {return URL_S2_API+'paper/arXiv:'+id;}
function url_s2_paperId(id) {return URL_S2_API+'paper/'+id;}
function url_s2_author(id)  {return URL_S2_API+'author/'+id;}

function myfail(msg, doalert){
    if (typeof(doalert)==='undefined') doalert = false;

    console.log(msg);
    if (doalert) alert(msg);
    throw new Error(msg);
}

function current_article(){
    var url = $(location).attr('href');
    var re_url = new RegExp('^http(?:s)?://arxiv.org/abs/(\\d{4}\\.\\d{4,5})(?:\\?.*)?$');
    var match = re_url.exec(url);

    if (!match)
        myfail("Semantic Scholar Overlay: no article ID extracted", false);

    return match[1];
}

function is_overlay_loaded(){
    if (typeof _s2overlayed !== 'undefined')
        return true;
    _s2overlayed = true;
    return false;
}

function brand(target, before) {
    if (typeof(before)==='undefined') before = true;

    var height = target.height();
    var width = Math.floor(55./44. * height);

    var img = $('<img>')
        .attr('src', URL_LOGO)
        .width(width)
        .height(height)

    var link = $('<a>').attr('href', URL_S2_HOME);

    if (before)  target.prepend(link);
    if (!before) target.append(link);

    img.appendTo(link);
}

function load_data(url, callback, failmsg){
    if (url in cache)
        return callback(cache[url]);

    $.get(url, function(data){
        cache[url] = data;
        callback(data);
     })
     .fail(function(err) {
         myfail(failmsg, true);
     });
}

function gogogo(){
    if (is_overlay_loaded())
        return;

    var url = url_s2_paper(current_article());
    load_data(
        url, load_overlay,
        'S2 unavailable -- click the shield in the '+
        'address bar and allow unathenticated sources '+
        '(load unsafe scripts) due to http requests to '+
        'Semantic Scholar API'
    );
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

function replace_author_links(authors){
    var auths = $('div.authors a');

    for (var i=0; i<auths.length; i++){
        $(auths[i])
            .attr('href', authors[i].url)
            .text(authors[i].name);
    }
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

function paging(name, page){
    // perform paging, used in the breadcrumbs

}

function range(l, h){
    arr = [];
    for (var i=l; i<=h; i++) arr.push(i);
    return arr;
}

function create_pagination(meta){
    var pages = $('<div>')
        .addClass('s2-pagination');

    var indices = [];

    var ncrumbs = 2*PAGE_CENTRAL_CRUMBS + 2*2 + 1;
    var low = max(meta.page - PAGE_CENTRAL_CRUMBS, 0);
    var high = min(meta.page + PAGE_CENTRAL_CRUMBS, meta.npages-1);

    var indices = range(low, high);

    var remaining = ncrumbs - indices.length;//(high - low) - 1;

    if (high - meta.page
    var nleft = remaining - (high - meta.page);
    var nright = remaining - (meta.page - low);

    console.log(remaining);
    console.log(nleft);
    console.log(nright);

    console.log(indices);
}

function create_column(meta){
    var references = meta.data[meta.identifier];
    var column = $('<div>').addClass('s2-col');

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
        .appendTo(column)

    create_pagination(meta)

    // inject the papers with authors into the column
    var len = references.length;
    for (var i=0; i<min(PAGE_LENGTH, len); i++)
        column.append(paper_line(references[i]));

    $('#'+meta.htmlid).replaceWith(column);
    brand($('#'+brandid));
    return column;
}

function load_overlay(data){

    data.references = influential_to_top(data.references);
    data.citations = influential_to_top(data.citations);
    gdata = data;

    metaleft = {
        title: 'References',
        identifier: 'references',
        s2anchor: '#citedPapers',
        description: 'highly influential references',
        htmlid: 'col-references',
        npages: Math.floor(data.references.length / PAGE_LENGTH)+1,
        page: 0,
        data: data,
    };
    metaright = {
        title: 'Citations',
        identifier: 'citations',
        s2anchor: '#citingPapers',
        description: 'highly influenced citations',
        htmlid: 'col-citations',
        npages: Math.floor(data.citations.length / PAGE_LENGTH)+1,
        page: 0,
        data: data
    };

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
