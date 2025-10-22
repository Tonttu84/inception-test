# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Fastify port
EXPOSE 3000

# Run the server
CMD ["npx", "ts-node", "src/server.ts"]
