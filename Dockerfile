# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the ports the app runs on
EXPOSE 3000 3001

# Define the command to run your app
CMD ["npm", "start"]
