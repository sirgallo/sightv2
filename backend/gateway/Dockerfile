FROM buildapi

COPY backend/common ./common
COPY backend/core ./core
COPY backend/db ./db
COPY backend/declarations ./declarations
COPY backend/gateway ./gateway
COPY backend/server ./server

RUN npm run build:all

EXPOSE 1234

CMD [ "npm", "run", "start:gateway" ]