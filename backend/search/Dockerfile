FROM buildapi

COPY backend/common ./common
COPY backend/core ./core
COPY backend/db ./db
COPY backend/declarations ./declarations
COPY backend/search ./search
COPY backend/server ./server

RUN npm run build:all

EXPOSE 2345

CMD [ "npm", "run", "start:search" ]