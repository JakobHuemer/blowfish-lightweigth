cd hugo

[ -d "~/hugo_cache" ] && rm -rf "~/hugo_cache"

docker run --rm \
  --name hugo-blowfish-helpr \
  -v ${PWD}:/src \
  -v ${HOME}/hugo_cache:/tmp/hugo_cache \
  -p 1313:1313 \
  hugomods/hugo:exts-non-root \
  server --watch --bind=0.0.0.0