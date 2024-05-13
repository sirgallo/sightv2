# endpoints


`/gateway/auth/register`

curl --location 'https://<your-host>/gateway/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "userId": "test_user_id",
  "email": "test_user_email@email.com",
  "password": "test_password_1234",
  "displayName": "test_user",
  "phone": "123-456-7890",
  "org": "test_org",
  "role": "ADMIN"
}'

`/gateway/auth/authenticate`

curl --location 'https://<your-host>/gateway/auth/authenticate' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test_user_email@email.com",
  "password": "test_password_1234"
}'

`/gateway/account/details`

curl --location 'https://<your-host>/gateway/account/details' \
--header 'authorization: Bearer <your-json-web-token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test_user_email@email.com"
}'

`/gateway/account/update`

curl --location --request GET 'https://<your-hots>/gateway/account/update' \
--header 'authorization: Bearer <your-json-web-token>' \
--header 'Content-Type: application/json' \
--data '{
    "filter": { 
      "userId": "test_user_id"
    },
    "update": {
      "phone": "0987-654-321"
    }
}'

`/gateway/account/delete`

curl --location --request GET 'https://<your-hots>/gateway/account/delete' \
--header 'authorization: Bearer <your-json-web-token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "userId": "test_user_id"
}'