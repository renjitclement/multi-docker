##base image
FROM node:alpine as builder

#install some dependencies
WORKDIR /usr/app
COPY ./package.json ./
RUN npm install
COPY ./ ./
## npm build will create a build folder inside the /usr/app folder with all files.
RUN npm run build

##after the npm build from the above container, copy that to the nginx container
FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/app/build /usr/share/nginx/html
