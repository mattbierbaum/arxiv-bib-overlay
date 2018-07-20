(
    function(){
	    var base = 'https://mattbierbaum.github.io/arxiv-bib-overlay/static/';
        function loadScript(name, callback){
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = base+name;
            script.onreadystatechange = callback;
            script.onload = callback;
            head.appendChild(script);
        }
        function loadCSS(name, callback){
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = base+name;
            link.media = 'all';
            link.onreadystatechange = callback;
            link.onload = callback;
            head.appendChild(link)

        }
        function partial(func, arg0){
            return function(callback){
                func(arg0, callback);
            };
        }
        function chain(func, callback){
            return function(){
                func(callback);
            }
        }

        var funcs = [
            partial(loadScript, 'bib.js'),
            partial(loadScript, 'bib_source_s2.js'),
            partial(loadScript, 'bib_source_inspire.js'),
            partial(loadScript, 'bib_source_ads.js'),
            partial(loadScript, 'bib_lib.js'),
            partial(loadScript, 'jquery-3.2.1.min.js'),
            partial(loadCSS, 'style.css')
        ];

        var func = funcs[0]
        for (var i=1; i<funcs.length; i++)
            func = chain(funcs[i], func);
        func();
    }
)();
