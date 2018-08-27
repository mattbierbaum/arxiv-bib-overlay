    
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

export const URL_ASSET_BASE = ''
export const URL_PROXY = ''

export const EXTENSION_ASSET_BASE = 'static/'

export const API_ARXIV_METADATA = 'https://export.arxiv.org/api/query?id_list='
export const API_CROSSREF_CITE = 'https://dx.doi.org/'
export const API_SCHOLAR_SEARCH = 'https://scholar.google.com/scholar'

export const COOKIE_ACTIVE = 'biboverlay_active'
export const MAX_AUTHORS = 10
export const PAGE_LENGTH = 10
export const API_ARTICLE_COUNT = 200
export const API_TIMEOUT = 30 * 1000
