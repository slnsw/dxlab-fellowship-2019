    #!/usr/bin/env sh

    # abort on errors
    set -e

    # build
    yarn build

    # navigate into the build output directory
    cd dist

    # deploy to custom domain
    # echo 'www.example.com' > CNAME

    git init
    git add -A
    git commit -m 'deploy'

    # deploy to gh-pages
    git push -f git@github.com:slnsw/dxlab-fellowship-2019.git master:gh-pages

    cd -

#