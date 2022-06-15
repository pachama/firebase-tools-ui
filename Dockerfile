FROM node:16-buster

# Update apt repositories and install the Java JDK/JRE
RUN apt update -y && \
    apt install -y \
    openjdk-11-jre-headless

# Install the firebase suite globally
RUN npm install -g firebase-tools

RUN apt-get install -y nodejs
RUN npm install --location=global firebase-tools

WORKDIR /home/firebase
COPY . .

RUN npm install
RUN npm run build
RUN mv build/ server.bundle.js/

EXPOSE 3000
EXPOSE 4000
EXPOSE 4400
EXPOSE 5000
EXPOSE 5001
EXPOSE 8085
EXPOSE 8081
EXPOSE 9000
EXPOSE 9099
EXPOSE 9199
