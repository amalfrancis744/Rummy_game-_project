# API

## Setup

Clone the repo and install the dependencies.

```bash
git clone https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/mgp-rummy
cd mgp-rummy
```

```bash
npm install
```

#

## Environment Variables

- `.env` file is supported, create `.env` file in project's root folder and put all env variables in the file.

```
NODE_ENV=development or production
PORT=8092 use port as per sequence
WS_BASE_PATH=ws
BUCKET_NAME=mgp-vault-dev
AWS_DEFAULT_REGION=ap-south-1
INTER_COMMUNICATION_API_KEY=cX8G8fNmYb4
GAME_TOKEN_SECRET=d1302a72613f5485341a000

REDIS_URL=redis://redis-12787.gce.cloud.redislabs.com:12787
REDIS_PASSWORD=mDCliyOK1WU8hKLCkU0EDhVwz0Ixlor7

GAME_START_DELAY_SECONDS=5
GAME_INIT_COUNTDOWN_DELAY=5
TURN_TIMER=30
CARD_SUBMIT_TIMER=30

MONGO_DB_CONNECTION_URL=mongodb://<username>:<password>@<host>/<database_name>


#
## Dev Server

```

npm run dev

```

## Start the Production Server

```

npm start

```
 ## build docker image

```

sudo docker build . -t mgp-rummy:1.0.0-SNAPSHOT

```
#
## Swagger
Open 'http://localhost:8089/api-docs' url for API documentation (only available in non prod environment)

#
```
