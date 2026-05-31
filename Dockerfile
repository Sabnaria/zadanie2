#budowanie obrazu z scratch
FROM scratch AS app_build

ADD alpine-minirootfs-3.23.3-aarch64.tar /

RUN apk update && \
    apk upgrade && \
    apk add --no-cache nodejs npm && \
    rm -rf /etc/apk/cache

#Utworzenie uytkownika i grupy "node    "
RUN addgroup -S node && adduser -S node -G node

USER node
#zmiana lokalizacji na katalog node i app
WORKDIR /home/node/app
#kopiowanie plików do katalogu node

#kopiowanie plików do katalogu node 
COPY --chown=node:node package.json ./package.json
RUN npm install

COPY --chown=node:node server.js ./server.js


#tworzenie obrazu
FROM node:alpine3.23 AS prod
LABEL org.opencontainers.image.authors="Martyna Debowczyk"
#update i instalacja curl
RUN apk add --update --no-cache curl && \
    rm -rf /etc/apk/cache
#zmiana na usera node i katalogu node
USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
#przekopiowanie plików z budowania do katalogu node oraz instalacja expressu
COPY --from=app_build --chown=node:node /home/node/app/package.json ./
COPY --from=app_build --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=app_build --chown=node:node /home/node/app/server.js ./
#wystawienie portu i healthcheck
EXPOSE 3000
HEALTHCHECK --interval=4s --timeout=20s --start-period=2s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["node", "server.js"]
