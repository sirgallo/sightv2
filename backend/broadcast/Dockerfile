FROM buildapi

COPY ./backend/common ./common
COPY ./backend/core ./core
COPY ./backend/db ./db
COPY ./backend/declarations ./declarations
COPY ./backend/server ./server
COPY ./backend/ServerConfigurations.ts ./
COPY ./backend/broadcast ./broadcast

RUN npm run build:all

EXPOSE 1000 1001 1002 1003

CMD [ "npm", "run", "start:broadcast" ]