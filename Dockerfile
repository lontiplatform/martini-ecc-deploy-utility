FROM node:12-alpine

LABEL \
  maintainer="Rashed Obaid <rashed.obaid@lonti.com>" \
  org.opencontainers.image.title="martini-ecc-deploy-utilty" \
  org.opencontainers.image.description="Archives and deploys packages to Martini via Lonti ECC." \
  org.opencontainers.image.authors="Rashed Obaid <rashed.obaid@lonti.com>" \
  org.opencontainers.image.url="https://github.com/lontiplatform/martini-ecc-deploy-utilty" \
  org.opencontainers.image.vendor="https://lonti.com" \
  org.opencontainers.image.licenses="MIT"

COPY LICENSE README.md ./

COPY dist/ ./dist/

COPY entrypoint.sh ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
