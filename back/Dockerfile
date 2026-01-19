FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3333
CMD ["node", "ace", "serve", "--watch"]
