# Use official Node.js image (full version for Prisma compatibility)
FROM node:20

WORKDIR /usr/src/app

# Copy package files first for efficient caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3013

# Command to run the application using tsx (already a dependency)
CMD ["npm", "start"]
