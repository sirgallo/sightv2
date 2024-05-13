FROM buildapi

COPY ./backend/common ./common
COPY ./backend/core ./core
COPY ./backend/db ./db
COPY ./backend/declarations ./declarations
COPY ./backend/server ./server
COPY ./backend/ServerConfigurations.ts ./
COPY ./backend/broadcast ./broadcast

RUN npm run build:all

EXPOSE 9998 9999

CMD [ "npm", "run", "start:broadcast" ]