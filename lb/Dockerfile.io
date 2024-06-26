FROM haproxy:latest 

USER root

RUN apt-get update 
RUN apt-get install -y ca-certificates

COPY ./lb/configs/haproxy.io.cfg /usr/local/etc/haproxy/haproxy.cfg

RUN update-ca-certificates