#
# Build Remoto server
#
FROM golang:alpine AS builder_server
WORKDIR /app

# Install dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

# Build the server
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/remoto

#
# Build client
#
FROM node:alpine as builder_client
WORKDIR /app

# Install dependencies
COPY client/package.json .
COPY client/yarn.lock .
RUN yarn install --pure-lockfile

# Build client
COPY client/ /app/
RUN yarn build

# Bundle production
FROM scratch AS production
WORKDIR /app
COPY --from=builder_server /app/remoto /app/remoto
COPY --from=builder_client /app/dist /app/client/dist
CMD ["/app/remoto"]