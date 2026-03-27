FROM node:20

ARG GITHUB_TOKEN
RUN npm config set //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN} && \
    npm config set @48-iq:registry https://npm.pkg.github.com

WORKDIR /usr/src/app

COPY package*.json ./


RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]