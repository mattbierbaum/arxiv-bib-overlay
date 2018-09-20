Bibliographic Explorer (bibex)
==============================

Overview
--------

The explorer is written as an overlay to the abstract pages, providing
information from different community-supported API sources. For the classic
system, it places itself on the page by inserting elements with vanilla
javascript and putting React components into those elements.

Development environment
-----------------------

It is built in Typescript (TS, superset of Javascript with typing), ReactJS for
building the UI components, and packages are handled via node. The various
folders are

* `build` -- where releases are created (transpiled from typescript)
* `docs` -- you are here now
* `extension` -- things needed to build a browser extension for bibex
* `node_modules` -- node packages, there's a lot of them
* `public` -- the static abs page which is used for developement / testing
* `src` -- the actual Typescript source
* `tools` -- python tools for extra processing (build extension, host bookmarklet)
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

    python tools/server.py

To build the extension, run:

    python tools/packextension.py

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
