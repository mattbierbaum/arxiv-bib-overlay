// https://arxiv.org/abs/1705.10311

var URL_S2_API = 'http://api.semanticscholar.org/v1/';

function min(a, b){return (a < b) ? a : b;}
function max(a, b){return (a > b) ? a : b;}

function url_s2_paper(id)   {return URL_S2_API+'paper/arXiv:'+id;}
function url_s2_paperId(id) {return URL_S2_API+'paper/'+id;}
function url_s2_author(id)  {return URL_S2_API+'author/'+id;}

function current_article(){
    var url = $(location).attr('href');
    var re_url = new RegExp('^http(?:s)?://arxiv.org/abs/(\\d{4}\\.\\d{4,5})(?:\\?.*)?$');
    var match = re_url.exec(url);

    if (!match)
        $.fail(function (err) {console.log("sup erbad");});

    return match[1];
}

function is_overlay_loaded(){
    if (typeof _s2overlayed !== 'undefined')
        return true;
    _s2overlayed = true;
    return false;
}

function load_css(callback){
    callback();
    return;
    $('<link>')
        .appendTo('head')
        .attr({
            type: 'text/css', 
            rel: 'stylesheet',
            href: url_asset('style.css'),
            onload: callback
        });
}

function load_data(url, callback, failmsg){
    $.get(url, callback)
     .fail(function(err) {
         alert(failmsg);
     });
}

function gogogo(){
    if (is_overlay_loaded())
        return;

    var url = url_s2_paper(current_article());
    load_data(
        url, draw_overlays,
        'S2 unavailable -- click the shield in the '+
        'address bar and allow unathenticated sources '+
        '(load unsafe scripts) due to http requests to '+
        'Semantic Scholar API'
    );
}

function draw_overlays(data){
    function _authors(ref, base){
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

                base.append(elem);
            },
            'Could not find paper "'+ref.title+'"'
        );
    }

    function _paper(ref){
        return $('<div>')
            .addClass('s2-paper')
            .append(
                $('<a>')
                  .attr('href', ref.url)
                  .text(ref.title)
            );
    }

    function create_column(references, header, anchorbase, anchorlink){
        var column = $('<div>');

        $('<h2>')
            .appendTo(column)
            .text(header);

        var len = references.length;
        for (var i=0; i<min(5, len); i++){
            var e = _paper(references[i]);
            _authors(references[i], e);
            column.append(e);
        }

        $('<h2>')
            .appendTo(column)
            .css('text-align', 'center')
            .append(
                $('<a>').attr('href', link+anchorlink).text('...')
            )

        return column;
    }


    function replace_author_links(authors){
        var auths = $('div.authors a');

        for (var i=0; i<auths.length; i++){
            $(auths[i])
                .attr('href', authors[i].url)
                .text(authors[i].name);
        }

    }

    var link = data.url;
    $('<div>')
        .insertBefore($('.submission-history'))
        .addClass('s2-col2')
        .append(create_column(data.references, 'References', link, '#citedPapers'))
        .append(create_column(data.citations, 'Citations', link, '#citingPapers'));

    replace_author_links(data.authors);
}

gogogo();

