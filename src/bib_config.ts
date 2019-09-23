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

export const MAX_AUTHORS = 10
export const PAGE_LENGTH = 10
export const API_ARTICLE_COUNT = 200
export const API_TIMEOUT = 30 * 1000

// settings that are determined by policy
// what the actual abs section is to be called
export const POLICY_SECTION_HEADER = 'Bibliographic data'
export const POLICY_PROJECT_SHORTNAME = 'Bibex'
export const POLICY_DESCRIPTION_PAGE = 'https://labs.arxiv.org'

// whether or not to trap the api calls that are made for stats purposes
export const POLICY_RECORD_API_STATS = true

// whether to track the datasource for each category using cookies
export const POLICY_REMEMBER_DATASOURCE = true

// if bibex is enabled or disabled by default
export const POLICY_DEFAULT_ENABLED = false

// if we should periodically remind users to check out the labs
export const POLICY_PERIODICALLY_REMIND_USERS = true

// how often we remind them
export const POLICY_REMINDER_PERIOD = 30 * 24 * 60 * 60 // one month in seconds

// display the "References and citations" section even when there is no datasource
export const POLICY_ALWAYS_DISPLAY_SECTION = false

// display [ Disable bibex (what is bibex)], turned on for both extension
export const POLICY_SHOW_HELP_LINKS = true

// which data sources are enabled
export const POLICY_DATASOURCE_LIST = ['s2', 'prophy', 'ads']//, 'inspire']

// cookie under which all settings are stored
export const POLICY_COOKIE_NAME = 'arxiv_bibex'

// cookie expiration time in days
export const POLICY_COOKIE_EXPIRATION = 365 * 30

// localstorage keyname (for cross-tab rate limiting)
export const POLICY_LIMITER_LOCALSTORAGE_KEY = 'arxiv_bibex_limiter'

// limiter rate in number per second
export const POLICY_LIMITER_RATE = 3

// limiter capacity until it starts to overflow (queue depth)
export const POLICY_LIMITER_CAPACITY = 3

// employ ADS OAuth token service or use the global token (not good practice)
export const POLICY_ADS_OAUTH_SERVICE = true
