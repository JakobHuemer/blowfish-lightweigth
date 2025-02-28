cd hugo

[ -d "~/hugo_cache" ] && rm -rf "~/hugo_cache"

docker run --rm \
  --name mysite \
  -v ${PWD}:/src \
  -v ${HOME}/hugo_cache:/tmp/hugo_cache \
  hugomods/hugo:exts-non-root \
  build