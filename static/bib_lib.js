var API_ARTICLE_COUNT = 200;
var API_TIMEOUT = 30*1000;
var URL_ASSET_BASE = 'https://mattbierbaum.github.io/arxiv-bib-overlay/';

function min(a, b){return (a < b) ? a : b;}
function max(a, b){return (a > b) ? a : b;}

function OverlayException(message) {
    this.message = message;
    this.name = 'OverlayException';
}

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

function urlproxy(url){
    return url;
    //return 'http://tmper.co:9999/?url='+encodeURIComponent(url);
}

var RE_IDENTIFIER = new RegExp(
    '(?:'+                                           // begin OR group
      '(?:arXiv:)(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)'+   // there is a new-form arxiv id
        '|'+                                             // OR
      '(?:([a-z\\-]{1,12}\\/\\d{7})(?:v\\d{1,3})?)'+   // old-form id (not allowed by S2)
        '|'+
      '(?:^(?:(\\d{4}\\.\\d{4,5})(?:v\\d{1,3})?)$)'+   // new-form with no preamble
    ')'                                              // end OR group
);

Array.prototype.remove = function(element){
    var index = this.indexOf(element);
    if (index > -1) {
        this.splice(index, 1);
    }
}
