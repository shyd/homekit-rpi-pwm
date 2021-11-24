FROM node:16-slim

WORKDIR /usr/src/app

COPY package.json .
COPY tsconfig.json .
ADD src ./src

RUN npm install

RUN npm run build

VOLUME /usr/src/app/persist

CMD ["npm", "start"]
EXPOSE 47128