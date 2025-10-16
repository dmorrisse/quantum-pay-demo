##
# Multi-stage build for the Quantum Pay demo application.  The first stage
# installs dependencies and builds the frontend, and the final stage
# assembles the production bundle and runs the Node server.
##

# Build stage: install dependencies and build the client
FROM node:18-alpine AS build

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

# Install client dependencies and build the frontend
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install && npm run build

# Copy the rest of the source code into the image
COPY server ./server
# Copy the built client into the server's static directory.  The build
# output is located in client/dist after running `npm run build`.
RUN rm -rf server/client && mkdir -p server/client/dist && cp -r client/dist/* server/client/dist/

# Final stage: run the server
FROM node:18-alpine

WORKDIR /app/server

# Copy the built server and client files from the previous stage
COPY --from=build /app/server /app/server

ENV NODE_ENV=production
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]