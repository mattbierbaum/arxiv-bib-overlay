(
    function(){
	    var base = 'https://mattbierbaum.github.io/semantic-scholar-arxiv-overlay/static/';
        function loadScript(url, callback){
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = base+'jquery-3.2.1.min.js';
            script.onreadystatechange = loadcss;
            script.onload = loadcss;
            head.appendChild(script);
        }
        function loadcss(){
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = base+'style.css';
            link.media = 'all';
            link.onreadystatechange = loadOverlay;
            link.onload = loadOverlay;
            head.appendChild(link)

        }
        function loadOverlay(){
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = base+'bib.js';
            head.appendChild(script)
        };
        loadScript();
    }
)();
