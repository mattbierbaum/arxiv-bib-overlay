// https://arxiv.org/abs/1705.10311

var cache = {};
var metaleft, metaright;

// number of papers per page
var PAGE_LENGTH = 10;

var URL_LOGO = 'https://s3.amazonaws.com/public.runat.me/s2overlay/s2logo.png';
try {
    URL_LOGO = chrome.extension.getURL('static/s2logo.png');
} catch(err) {
    console.log('we are not an extension right now');
}

var URL_S2_HOME = 'https://semanticscholar.org';
var URL_S2_API = 'http://api.semanticscholar.org/v1/';

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

    if (get_category() != 'cs')
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

function page(id, n){
    console.log(id);
    console.log(n);
    var meta = (id == metaleft.identifier) ? metaleft : metaright;
    meta.page = n;
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
                    .click(function (){ page(meta.identifier, n); })
                    .html(txt)
        return $('<li>').append(link);
    }

    var pages = $('<ul>').addClass('page-list')

    pages.append((meta.page == 0) ? _nolink(langle) : _link(langle, 0));

    var BUFF = 2;
    var bufferl = Math.max(0, meta.page-BUFF);
    var bufferr = Math.min(meta.npages-1, meta.page+BUFF);

    if (bufferl >= BUFF-1)
        pages.append(_link(1, 0));
    if (bufferl >= BUFF)
        pages.append(_nolink(dots));

    for (var i=bufferl; i<=bufferr; i++)
        pages.append((i == meta.page) ? _nolink(i+1, 'bold') : _link(i+1, i));

    if (bufferr < meta.npages-BUFF)
        pages.append(_nolink(dots));
    if (bufferr < meta.npages-(BUFF-1))
        pages.append(_link(meta.npages, meta.npages-1));

    if (meta.page >= meta.npages-1)
        pages.append(_nolink(rangle));
    else
        pages.append(_link(rangle, meta.npages-1));

    return $('<div>')
        .addClass('page')
        .append($('<span>').text("Pages: "))
        .append(pages);
}

function create_column(meta){
    var references = meta.data[meta.identifier];
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
    brand($('#'+brandid));
    return column;
}

function load_overlay(data){
    data.references = influential_to_top(data.references);
    data.citations = influential_to_top(data.citations);

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
