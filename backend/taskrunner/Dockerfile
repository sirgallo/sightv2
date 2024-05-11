FROM buildapi

COPY backend/common ./common
COPY backend/core ./core
COPY backend/db ./db
COPY backend/declarations ./declarations
COPY backend/server ./server
COPY backend/taskrunner ./taskrunner

RUN npm run build:all

EXPOSE 3456

CMD [ "npm", "run", "start:taskrunner" ]