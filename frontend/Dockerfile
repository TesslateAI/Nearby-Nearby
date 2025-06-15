# Use a Node.js base image suitable for development
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, etc.) first
# to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# The Vite dev server needs to be exposed on port 5173
EXPOSE 5173

# The command to start the Vite development server
# The `--host` flag is crucial to make the server accessible from outside the container
CMD ["npm", "run", "dev"]