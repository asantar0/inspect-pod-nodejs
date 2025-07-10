# Basic
FROM node:24-alpine

# Workdir
WORKDIR /app

# Copy json files
COPY package*.json ./

# Copy xource code
COPY . .

# Install dependencies
RUN npm install

# Port exposure
EXPOSE 3000

# Command
CMD ["node", "index.js"]
