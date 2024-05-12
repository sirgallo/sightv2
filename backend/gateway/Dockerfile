FROM buildapi

COPY ./backend/common ./common
COPY ./backend/core ./core
COPY ./backend/db ./db
COPY ./backend/declarations ./declarations
COPY ./backend/server ./server
COPY ./backend/ServerConfigurations.ts ./
COPY ./backend/gateway ./gateway

RUN npm run build:all

EXPOSE 1234

CMD [ "npm", "run", "start:gateway" ]