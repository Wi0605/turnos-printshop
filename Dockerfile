FROM node:18-alpine

WORKDIR /app

ENV TZ=America/Bogota
RUN apk add --no-cache tzdata

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]