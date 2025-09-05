FROM node:lts

WORKDIR /app
COPY package*.json ./
RUN npm install -g expo-cli @expo/ngrok && npm install

COPY . .

EXPOSE 8081 19000 19001

CMD ["npx", "expo", "start", "--tunnel"]