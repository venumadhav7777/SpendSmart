# Dockerfile
FROM node:slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

EXPOSE 3004
CMD ["npm", "run", "dev"]
