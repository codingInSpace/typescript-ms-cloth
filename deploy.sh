git checkout master
git branch -D gh-pages
git checkout -b gh-pages
git merge master
yarn build
mv public/* .
echo "Edit index.html: /bundle.js -> bundle.js then force push"
