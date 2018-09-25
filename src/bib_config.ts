/*
 * Configuration options spread throughout the application should be
 * accumulated here if they are intended to be changed or appear in multiple
 * places.
*/
export const URL_PROXY = ''

export const API_ARXIV_METADATA = 'https://export.arxiv.org/api/query?id_list='
export const API_CROSSREF_CITE = 'https://dx.doi.org/'
export const API_SCHOLAR_SEARCH = 'https://scholar.google.com/scholar'

export const API_STATS_IMAGE = 'https://arxiv.org/bibex/apistats.png'
export const RECORD_API_STATS = true

export const COOKIE_ACTIVE = 'biboverlay_active'
export const MAX_AUTHORS = 10
export const PAGE_LENGTH = 10
export const API_ARTICLE_COUNT = 200
export const API_TIMEOUT = 30 * 1000

export const DATA_PROVIDER_LIST = ['s2']//, 'ads', 'inspire']
