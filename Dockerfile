# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port (change if necessary)
EXPOSE 8080

# Start the app in dev (optional: you can use 'npm run start:dev' if you prefer)
CMD ["npm", "run", "start"]
