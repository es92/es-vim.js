#!/bin/bash

URL=${1:-localhost}

echo $URL

mkdir -p https
openssl genrsa -des3 -out https/server.key 2048
openssl rsa -in https/server.key -out https/server.key
openssl req -sha256 -new -key https/server.key -out https/server.csr -subj "/CN=$URL"
openssl x509 -req -days 365 -in https/server.csr -signkey https/server.key -out https/server.crt
