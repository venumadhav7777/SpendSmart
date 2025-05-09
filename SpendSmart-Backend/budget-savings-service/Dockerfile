# Dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./ 
RUN npm install

# Copy source
COPY . .

# Build step (if any)
# RUN npm run build

# Add environment variable check
RUN echo "Checking environment variables..." && \
    echo "MANUAL_TRANSACTIONS_SERVICE_URL: $MANUAL_TRANSACTIONS_SERVICE_URL"

EXPOSE 3003
CMD ["npm", "run", "dev"]
