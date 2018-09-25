if [ ! -d "deploy-static" ]; then
    echo "Must be run from the project root directory i.e. ./deploy-static/pack-to-deploy.sh"
    exit 0
fi

DIR=deploy-static/deploy

mkdir -p $DIR
cp build/static/js/main*.js $DIR/bibex.js
cp build/static/css/main*.css $DIR/bibex.css
cp src/assets/apistats.png $DIR/apistats.png
