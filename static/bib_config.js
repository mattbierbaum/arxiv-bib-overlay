(function(exports){
    
// Note: this URL should be part of config, but I didn't want to set it twice.
// The bootstrapping starts with biboverlay.js, which needs to have the asset
// urls in order to grab the rest of the JS. Therefore, biboverlay.js stores
// these two values and sets them in this module after loading it. Otherwise,
// configuration would need to be duplicated.
//
// Furthermore, this value only should be set in the case of being loaded
// outside of the extension. In that case, the overlay must be bootstrapped
// from biboverlay.js. So this URL is only relevant when biboverlay is used
// anyway.
exports.URL_ASSET_BASE = '';
exports.URL_PROXY = '';

exports.EXTENSION_ASSET_BASE = 'static/';

exports.API_ARXIV_METADATA = 'https://export.arxiv.org/api/query?id_list=';
exports.API_CROSSREF_CITE = 'https://dx.doi.org/';
exports.API_SCHOLAR_SEARCH = 'https://scholar.google.com/scholar';

exports.COOKIE_ACTIVE = 'biboverlay_active';
exports.MAX_AUTHORS = 10;
exports.PAGE_LENGTH = 10;
exports.API_ARTICLE_COUNT = 200;
exports.API_TIMEOUT = 30*1000;

}(typeof exports === 'undefined' ? this.bib_config = {} : exports));
