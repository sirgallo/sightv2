FROM redis:latest

RUN apt-get update && apt-get install -y wget ca-certificates

COPY ./redis/conf/redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]