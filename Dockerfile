FROM node:21-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm i -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine as prod-stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;""]
