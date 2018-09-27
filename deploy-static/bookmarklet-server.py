#!/usr/bin/env python
"""
The appropriate bookmarklet for testing is therefore:
    javascript:(
        function(){
            var script = document.createElement('script');
            var child = document.body.appendChild(script);
            child.src = 'http://127.0.0.1:8001/bookmarklet.js';
        }
    )();

or, minified:
javascript:(function(){document.body.appendChild(document.createElement('script')).src='http://127.0.0.1:8001/bookmarklet.js';})();

This will call this server and grab the built js and css to inject onto the
current page, if it is an arxiv abstract page.
"""
import os
import json
import string
from http.server import HTTPServer, SimpleHTTPRequestHandler, test

PORT = 8001

class AtTemplate(string.Template):
    delimiter = '@'


def create_bookmarklet():
    build_path = os.path.join(os.path.abspath(os.path.curdir), 'build')
    script_path = os.path.dirname(os.path.abspath(__file__))

    template = os.path.join(script_path, 'bookmarklet.js')
    manifest = os.path.join(build_path, 'asset-manifest.json')
    return bookmarklet_text(template, manifest)


def bookmarklet_text(template, manifest):
    filenames = list(json.load(open(manifest)).values())

    tpl = AtTemplate(open(template).read())
    return tpl.substitute(filenames=filenames, port=PORT)


class FlexibleBookmarklet(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/bookmarklet.js':
            return super(FlexibleBookmarklet, self).do_GET()

        content = create_bookmarklet()
        self.send_response(200)
        self.send_header('Content-type', 'text/javascript')
        self.end_headers()
        self.wfile.write(content.encode('utf-8'))

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)


if __name__ == '__main__':
    test(FlexibleBookmarklet, HTTPServer, port=PORT)
