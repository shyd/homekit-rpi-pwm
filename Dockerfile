FROM node:17-slim

WORKDIR /usr/src/app

COPY package.json .
COPY tsconfig.json .
ADD src ./src

RUN npm install

RUN npm run build

CMD ["npm", "start"]
EXPOSE 47128