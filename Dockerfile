# -------- Build Stage --------
FROM node:18-alpine AS build
WORKDIR /app

# Copy and install server dependencies
COPY server ./server
RUN cd server && npm install

# Copy client files and build frontend
COPY client ./client
WORKDIR /app/client
RUN npm install && npm run build

# -------- Production Stage --------
FROM node:18-alpine AS production
WORKDIR /app

# Copy everything needed from build stage
COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/server/client-build

# Start the server
WORKDIR /app/server
EXPOSE 8080
CMD ["node", "index.js"]
