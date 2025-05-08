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

EXPOSE 3005
CMD ["npm", "run", "dev"]
