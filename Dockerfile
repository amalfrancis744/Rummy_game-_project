FROM node:12-alpine
#add port as per sequnce
ENV PORT=8092

COPY . /
WORKDIR /

RUN npm install

#Expose Port
EXPOSE 8089

CMD [ "npm", "start" ]
