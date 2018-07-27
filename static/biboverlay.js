(
    function(){
        /*function random_id(){
            return String(Math.random()).substring(2,12);
        }
        var date = random_id();
        var base = 'http://127.0.0.1:8000/static/';*/

        var date = '20180727-0'
        var base = 'https://static.arxiv.org/biboverlay/';
        function load(filename){
            /*
             This is a bit complicated in order to have deferred, ordered
             processing while maintaining parallel downloading. This should
             cover all browsers down to:
                  FF 3.6, Chrome 8, Opera 15, Safari 5.1, Android 3, IE 6

              but specifically not for Opera Mini (2.5% of all browsing)
            */
            var elem = null;

            if (/\.css[^\.]*$/.test(filename)){
                elem = document.createElement('link');
                elem.rel  = 'stylesheet';
                elem.type = 'text/css';
                elem.href = base + filename + '?' + date;
                elem.media = 'all';
            } else {
                elem = document.createElement('script');
                elem.type = 'text/javascript';
                elem.src = base + filename + '?' + date;
            }

            elem.defer = false;
            elem.async = false;
            elem.onload = elem.error = elem.onreadystatechange = function(event){
                var ie678 = (
                    /loaded|complete/.test(elem.readyState) &&
                    (!doc.documentMode || doc.documentMode < 9)
                );
                if (event.type === "load" || ie678){
                    elem.onload = elem.onreadystatechange = elem.onerror = null;
                }
            }

            // see comments in headjs/load.js:475 (loadAsset)
            // or https://www.html5rocks.com/en/tutorials/speed/script-loading/
            var head = document.head || doc.getElementsByTagName('head')[0];
            head.insertBefore(elem, head.lastChild);
        }

        var filenames = [
            'style.css',
            'jquery-3.2.1.min.js',
            'js.cookie-2.2.0.min.js',
            'bib_lib.js',
            'bib_source_s2.js',
            'bib_source_inspire.js',
            'bib_source_ads.js',
            'bib.js',
        ].forEach(function(i){load(i);});
    }
)();
