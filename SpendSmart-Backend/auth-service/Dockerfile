# Dockerfile
FROM node:slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Build step (if any)
# RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "dev"]
