FROM buildapi

COPY ./backend/common ./common
COPY ./backend/core ./core
COPY ./backend/db ./db
COPY ./backend/declarations ./declarations
COPY ./backend/server ./server
COPY ./backend/ServerConfigurations.ts ./
COPY ./backend/search ./search

RUN npm run build:all

EXPOSE 2345

CMD [ "npm", "run", "start:search" ]