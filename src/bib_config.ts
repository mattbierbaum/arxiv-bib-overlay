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

export const COOKIE_PREFIX = 'bibex'
export const MAX_AUTHORS = 10
export const PAGE_LENGTH = 10
export const API_ARTICLE_COUNT = 200
export const API_TIMEOUT = 30 * 1000

// settings that are determined by policy
export const POLICY_RECORD_API_STATS = true
export const POLICY_REMEMBER_DATASOURCE = true
export const POLICY_DEFAULT_ISACTIVE = false
export const POLICY_ALWAYS_DISPLAY_SECTION = true
export const POLICY_DATASOURCE_LIST = ['s2']//, 'ads', 'inspire']
