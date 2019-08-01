# arXiv bib overlay

A javascript package (bookmarklet and chrome [firefox] extension), which
displays the results of Semantic Scholar, ADS, Inspire HEP API calls onto arXiv
abstract pages. The bookmarklet can be added to the browser by visiting
[here](https://mattbierbaum.github.io/arxiv-bib-overlay/static/downloads.html)

# Build for deploy

To build the overlay for deployment, first change the `bib_config` to the
proper settings, making sure that `API_STATS_IMAGE` resolves to a valid URL.
Then, build the package using:

    npm run build

To ease remaning of files, etc there is a small shell script which will pull
together all built deployment files. You can run it with:

    ./deploy-static/pack-to-deploy.sh

Then, the release files will be located in `./deploy-static/deploy`. Copy these
files to the appropriate location.
