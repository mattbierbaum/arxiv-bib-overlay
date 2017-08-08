javascript:(
    function(){
        function loadScript(url, callback){
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onreadystatechange = callback;
            script.onload = callback;
            head.appendChild(script);
        }
        function loadOverlay(){
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'http://127.0.0.1:8000/static/s2overlay.js';
            console.log('hello');
            head.appendChild(script)
        };
        loadScript('http://127.0.0.1:8000/static/jquery-3.2.1.min.js', loadOverlay);
    }
)();
