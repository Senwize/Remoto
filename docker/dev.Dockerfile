FROM golang
WORKDIR /app

# Install dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

RUN go install github.com/cespare/reflex@latest

# Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - 
RUN apt-get install -y nodejs