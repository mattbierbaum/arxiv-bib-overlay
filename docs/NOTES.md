Bibliographic Explorer (bibex)
==============================

Overview
--------

The explorer is written as an overlay to the abstract pages, providing
information from different community-supported API sources. For the classic
system, it places itself on the page by inserting elements with vanilla
javascript and putting React components into those elements.

### Value and goals

To provide ease of navigation for an article's citation tree (forward and
backward) to enable discovery of relevant research and context within the
broader scientific community. These types of navigational tools are available
within many journal interfaces and 3rd tools (Scholar, ADS, Inspire, etc) and
provide immense value for researchers. In this project, we wish to provide
similar functionality for arXiv users -- to navigate the citation tree within
arXiv as well as to external resources including journals, bibliographic
databases, and citation database tools.

The main goals which we wish to cover are:

1. Listing known references and citations for a given article with
   comprehensive metadata (authors, year, journal, etc).

2. Provide filtering and viewing tools on arXiv abstract pages to enable
   easy access to parts of the citation tree.

3. Facilitate navigation to these articles within arXiv, to external journals,
   and to bibliographic databases as appropriate (as measured by community
   engagement).

Additionally, the following functionality is considered useful, though may not
ultimately fall under the perview of this project:

4. Provide tools to export article metadata in formats usable by bibliographic
   tools.

### Considerations and Barriers

A number of potential issues have been raised in through the NG user survey and
anecdotes concerning this project.

1. *Citation count metrics* -- while useful in determining "how many times a
   paper has been cited", there is continued debate concerning the relationship
   of citation counts to popularity, scientific novelty, and usefulness. At the
   same time, it is clear that 'citation count' is also intimately related to
   social and political issues such as funding, tenure, and general
   determination of qualification. Therefore, it remains unclear whether the
   arXiv (which has historically not shown bibliographic information) should
   display these potentially harmful metrics.

2. *Privacy (3rd party)* -- using APIs from external partners raises issues of
   user privacy, particular when the overlay may be enabled by default without
   adequate notification to users. Calls to the external APIs will allow 3rd
   parties to access individual reading habits (via IP / referrer url).

3. *Privacy (arXiv)* -- should we track external data accesses and usage
   patterns to better enable the more prevalent access patterns?

4. *Performance* -- new data access patterns and loading, as well as dynamic
   content creation, can cause undue degredation of loading times, scrolling
   performance. While initial testing do not indicate such issues, it should be
   monitored, especially for older hardware and browsers.

5. *3rd party requirements* -- as data is supplied from 3rd parties, we should
   recognize the extra API load that they will sustain and try to minimize our
   impact on their services. Additionally, we should recognize that our extra
   load may impact arXiv users' experience in site loading and reference
   navigation as well.

Requirements
------------

### User experience

* Automatically load and display citation information from a given data source.
* Selectable data source (when overlapping) and preference is automatically saved.
* On/off toggle with saved preferences.
* Outbound links for every entry when possible (to arxiv, doi, journal, scholar, etc)
* Navigation of citations provided with sorting, paging, filtering.

### Performance

* Deferred loading -- use of the overlay should not impact existing content
  loading, functionality, or responsiveness.

* Minimal javascript -- parsing time (an maintenance overhead) and time to
  perform overlay actions.

* Templating? Currently building structures in JQuery, but presumably
  templating would be more performant. Although, it could be the case that
  rendering is the primary issue anyway so that is irrelevant.

Development environment
-----------------------

It is built in Typescript (TS, superset of Javascript with typing), ReactJS for
building the UI components, and packages are handled via node. The various
folders are

* `bookmarklet` -- tools for hosting bibex as a bookmarklet
* `build` -- where releases are created (transpiled from typescript)
* `docs` -- you are here now
* `extension` -- things needed to build a browser extension for bibex
* `node_modules` -- node packages, there's a lot of them
* `public` -- the static abs page which is used for developement / testing
* `src` -- the actual Typescript source
* `web` -- older materials for uploading the extension to the app store

Therefore, mostly you will spend time in `src` to fix things / add features.

### Getting ready

After cloning the repo, get the `node_modules` required by the various packages
by running:

    npm install

This will download (some say too many) javascript packages that will be used to
get all tooling associated with Typescript, ReactJS, and more. To add new
packages, add a line to `package.json` and run the install command again. It
should now be available in the TS source.

With the packages installed, you should be able to run the tests, developement
server, etc.

### Developement tools

1. **Tests** -- to run the test suite, run `npm test`. It will launch a process
   that watches for file changes and runs the appropriate tests to make sure
   nothing bad happened.

2. **Server** -- running `npm start` will launch the debug server. This is a
   fully featured dev environment which provides source mappings between TS and
   JS so that you can interact with the TS as you normally would in the browser
   console. The command will also watch for file changes and tells you were to
   visit in the browser.

3. **Compiler and Linter** -- we run a linter for the TS to make sure
   everything looks consistent.  While this is run with `npm start` it is a bit
   clunky there. I recommend running the compiler externally:

        ./node_modules/typescript/bin/tsc -w  --noEmit --project ./

   as well as the linter:

        ./node_modules/tslint/bin/tslint --fix -p .

I typically run all of these at once to make sure code updates dont break
things.  It doesn't appear too taxing on my machine.

### Deployment

To get the final JS and assets for deploying, we again use node. To transpile
the source for all browsers, run:

    npm run build

This outputs a large number of things into `build`, which we then can host as a
static asset. Since there are paths of assets implied in our source, you need
to change the root path whenever the assets will be hosted somewhere different.
The command above will remind you, but it is changed in the field `homepage` in
`package.json`.

To host the bookmarklet, start the python server with:

    python bookmarklet/server.py

To build the extension, run:

    python extension/packextension.py

which will populate the `extension` folder so that it can be managed like other
extensions for chrome or firefox.

Implementation details
----------------------

Overall, the project is split into:

* *api* -- this that make data sources conform to our internal format
* *assets* -- static assets such as images, etc
* *model* -- the state of the application, used in essentially every component
* *ui* -- the various components which get rendered

I feel that these are relatively self-explanatory if each is investigated. The
biggest thing to keep in mind is that mobx/react are used such as when state is
modified, the user interface also changes. Therefore, modify `State::state` to
trigger view changes and not the other way around.

### Abstract integrations

There are only a few dependencies on the structure of the abstract page, all of which
are abstracted (get it) in the file `src/arxiv_page.ts`:

1. **Metadata** -- we pull information about the article from two places, one
   being `head.meta`.

2. **Subjects table** -- there is no category information in the meta head, so
   we grab category information from the table under the abstracts.

3. **Anchor elements** -- finally, there are the page elements used to house
   parts of the overlay. These may be added directly to the abstract in the
   future, but for now are created on the fly.

You can search for these interactions using:

    grep -R 'document\.' src/*

### Style

All style is defined in `src/App.css`. For the most part, I try to be verbose
in naming so that intent is understood. In general, webpack and gzip will solve
size issues and it is worth it to write a bit more code. Additionally, we avoid
name-space collisions with a prefix of `bib-` at the moment. Not all css has
been converted to these standards, but that is in process.

### Accessibility

This section is best directed to Liz, but so far I have used the WAVE browser
extension to do basic checks on Accessibility. For example, it directed me to
include more alt text for images so that screen readers would function better.

### Local storage

We set and get one cookie at the moment, to save whether bibex is active or
not.  In the future, with more data sources, we will include options to save
the default data source for each secondary category. This cookie can be found
in `src/cookies.ts`.

### Configuration

Basic configurations for the extension should be set and get from `bib_config`
so that if they are reused they are mutually done so.
