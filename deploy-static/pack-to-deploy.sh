if [ ! -d "deploy-static" ]; then
    echo "Must be run from the project root directory i.e. ./deploy-static/pack-to-deploy.sh"
    exit 0
fi

mkdir -p bookmarklet/deploy
cp build/static/js/main*.js bookmarklet/deploy/bibex.js
cp build/static/css/main*.css bookmarklet/deploy/bibex.css
cp src/assets/apistats.png bookmarklet/deploy/apistats.png
