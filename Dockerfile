FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Start your Node.js app
CMD ["node", "server.js"]
