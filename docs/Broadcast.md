# broadcast

### a secure, authenticated room based broadcast messsage broadcast service


## overview

Broadcast is a service that allows for real time, secure websocket connections. The underlying service utilizes the socket.io node.js (redis-streams-adapter)[https://socket.io/docs/v4/redis-streams-adapter/]. The implementation focuses on a few separate key features that should contribute to overall user experience:

 1. high availability and fault tolerance
 2. secure and authenticated client connections
 3. high performance and horizonatally scalable


## design

```mermaid
graph TD;
subgraph "connections"
  client.1(app user 1 - publisher)
  client.2(app user 2 - subscriber)
  client.3(app user 3 - subscriber)
end

subgraph "service"
    subgraph "vpc"
        subgraph "subnet.1.1 - client layer"
            lb[(load balancer)]
        end

        subgraph "subnet.1.2 - service layer"
            subgraph "broadcast.1"
                app.room.1["app room"]
            end

            subgraph "broadcast.2"
                app.room.2["app room"]
            end
        end

        subgraph "subnet1.3 - application data layer"
            redis(broadcast stream<br />user - room registry w/ hashes)
        end
    end
end

client.1 -->|Initial Handshake/Authenticate Token| lb
client.1 <-->|Subscribe Eligible Selected Rooms| lb
client.2 -->|Initial Handshake/Authenticate Token| lb
client.2 <-->|Subscribe Eligible Selected Rooms| lb
client.3 -->|Initial Handshake/Authenticate Token| lb
client.3 <-->|Determine Room Privileges/Publish Messages| lb

lb <-->|User 1 Socket Channel| broadcast.1
lb <-->|User 2 Socket Channel| broadcast.1
lb <-->|User 3 Socket Channel| broadcast.2

redis --> |Stream Socket Data| broadcast.1
redis --> |Stream Socket Data| broadcast.2

broadcast.1 --> |Update Auth Hashes| redis
broadcast.1 --> |Publish Data| redis
broadcast.2 --> |Update Auth Hashses| redis
```