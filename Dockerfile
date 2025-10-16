# -------- Build Stage --------
FROM node:18-alpine AS build
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install

# Install client dependencies and build
COPY client/package.json client/package-lock.json* ./client/
WORKDIR /app/client
RUN npm install && npm run build

# -------- Production Stage --------
FROM node:18-alpine AS production
WORKDIR /app

# Copy server
COPY --from=build /app/server /app/server
# Copy built frontend into server folder
COPY --from=build /app/client/dist /app/server/client-build

WORKDIR /app/server
EXPOSE 8080
CMD ["node", "index.js"]
