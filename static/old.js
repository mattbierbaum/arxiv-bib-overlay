//$('head').append('<link rel="stylesheet" type="text/css" href="style.css">');
{autoEnableFilters: true, queryString: "Christof Koch", page: 1, pageSize: 10, sort: "relevance",…}
authors:[]
autoEnableFilters:true
coAuthors:[]
facets:{}
page:1
pageSize:10
queryString:"Christof Koch"
sort:"relevance"
venues:[]
yearFilter:null

var data = {{data|safe}};

function create_table(){
    var div = document.createElement('div');
    div.classList = ['mkb-col2'];

    var cl = document.createElement('div');
    var cr = document.createElement('div');
    div.appendChild(cl);
    div.appendChild(cr);

    function elem(e){
        var href = "https://semanticscholar.org/paper/"+e['id'];
        var title = e['title'];
        var year = e['year'];
        var authors = e['authors'];

        var a0 = document.createElement('div');
        a0.classList = ['mkb-authors'];
        
        var len = authors.length;
        for (var j=0; j<len; j++){
            var name = authors[j]['name'];
            var nref = 'https://semanticscholar.org/author/'+authors[j]['id'];

            var a1 = document.createElement('a');
            a1.setAttribute('href', nref);
            a1.text = name;
            a0.appendChild(a1);
        }
        var d = document.createElement('div');
        d.classList = ['mkb-paper'];

        var t0 = document.createElement('a');
        t0.setAttribute('href', href);
        t0.text = title + ' ('+year+')';
        d.appendChild(t0);
        d.appendChild(a0);
        return d;
    }

    var link = 'https://semanticscholar.org/paper/'+data['paper']['id'];

    /* -------------------------------------------------------- */

    var arr = data['paper']['cited'];
    var len = arr.length;

    var h0 = document.createElement('h2');
    h0.innerHTML = 'References';
    h0.style.textAlign = 'center';

    cl.append(h0);
    for (var i=0; i<min(5, len); i++){
        cl.append(elem(arr[i]));
    }

    var h1 = document.createElement('h2');
    h1.style.textAlign = 'center';
    h1.innerHTML = '<a href="'+link+'#citedPapers">...</a>';
    cl.append(h1);
    
    /* -------------------------------------------------------- */

    var arr = data['paper']['citedBy'];
    var len = arr.length;

    var h0 = document.createElement('h2');
    h0.innerHTML = 'Cited by';
    h0.style.textAlign = 'center';

    cr.append(h0);

    for (var i=0; i<min(5, len); i++){
        cr.append(elem(arr[i]));
    }

    var h1 = document.createElement('h2');
    h1.style.textAlign = 'center';
    h1.innerHTML = '<a href="'+link+'#citingPapers">...</a>';
    cr.append(h1);

	var hist = document.getElementsByClassName('submission-history')[0];
    var left = document.getElementsByClassName('leftcolumn')[0];
    left.insertBefore(div, hist);
}

var ainfos = []
var auths = []

function modify_authors(){
    var sub = document.getElementsByClassName('dateline')[0];
    sub.style.textAlign = 'center';
    var auth = document.getElementsByClassName('authors')[0];
    auth.style.textAlign = 'center';

    var ind = 0;
    var n = auth.childNodes;
    for (var i=0; i<n.length; i++){
        if (n[i].tagName != 'A')
            continue;
        
        n[i].onmouseover = (function(){
            var elm = n[i];
            return function(){ showchildren(elm);}
        })();
        n[i].onmouseout = (function(){
            var elm = n[i];
            return function(){ hidechildren(elm);}
        })();

        var t = document.createElement('div');
        t.classList = ['mkb-lbl'];
        t.style.position = 'absolute';
        t.style.left = '-100px';
        t.style.top = '-100px';
        t.style.visibility = 'hidden';
        t.innerHTML = data['authors'][ind]['influenced'].join(', ');
        n[i].appendChild(t);

        // move it into place
        g = geom(t);
        cposition(n[i], t, 0, g.h+5);

        ind += 1;
    }
}

function showchildren(elm){
    var n = elm.childNodes;
    for (var i=0; i<n.length; i++){
        if (n[i].nodeName != '#text')
            n[i].style.visibility = 'visible';
    }
}

function hidechildren(elm){
    var n = elm.childNodes;
    for (var i=0; i<n.length; i++){
        if (n[i].nodeName != '#text')
            n[i].style.visibility = 'hidden';
    }
}

function min(a, b){
    return (a < b) ? a : b;
}
function max(a, b){
    return (a > b) ? a : b;
}

function geom(element) {
    var top = 0, left = 0;
    var height = element.offsetHeight, width = element.offsetWidth;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        t: top, l: left, h: height, w: width,
        cx: left+width/2, cy: top+height/2
    };
};

function translate(e, x, y){
    /* translate and element e by (x, y) */
    e.style.transform = '';
    var g = geom(e);
    var dx = x - g.l;
    var dy = y - g.t;
    e.style.transform = 'translate('+dx+'px,'+dy+'px)';
}

function cposition(e0, e1, dx, dy){
    /* center e1 about e0 with an offset dx, dy */
    dx = dx || 0;
    dy = dy || 0;
    g0 = geom(e0);
    g1 = geom(e1);
    translate(e1, g0.cx - g1.w/2 + dx, g0.cy - g1.h/2 + dy);
}

function load_css(){
    var link = document.createElement('link');
    link.id = 'plugin_css';
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'http://website.com/css/stylesheet.css';
    link.media = 'all';
    document.body.appendChild(link);
}

function inject(){
    load_css();
    create_table();
    modify_authors();
}

window.onload = inject;

