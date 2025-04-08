# Docker Deployment Guide

This guide explains how to deploy the NestJS application using Docker.

## Available Dockerfiles

This project includes two Dockerfile options:

1. **Standard Dockerfile** - Default configuration for production environments
2. **Simple Dockerfile** - Streamlined configuration for simpler deployments

## Simple Dockerfile Explanation

The `Dockerfile.simple` provides a streamlined approach to containerizing this NestJS application:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Configure environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV PORT=3000
ENV NODE_ENV=production

# Create basic .npmrc
RUN echo "legacy-peer-deps=true" > .npmrc

# Create crypto polyfill
COPY polyfills.js ./

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package.json and prisma
COPY package.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --only=prod --legacy-peer-deps --force

# Install NestJS CLI globally (required for the build process)
RUN npm install -g @nestjs/cli

# Rebuild bcrypt from source
RUN npm rebuild bcrypt --build-from-source

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the application code
COPY . .

# Build the application using NestJS CLI
RUN nest build

# Expose port - important for Railway
EXPOSE 3000

# Start the application
CMD ["node", "--max-old-space-size=2048", "dist/main.js"]
```

## Key Features

- Uses Node.js 18 Alpine for a small footprint
- Sets appropriate environment variables
- Configures npm with legacy peer dependencies
- Includes crypto polyfill for compatibility
- Installs build dependencies for native modules
- Installs NestJS CLI globally to properly build the application
- Rebuilds bcrypt from source for Alpine compatibility
- Generates Prisma client
- Exposes port 3000 for HTTP traffic
- Allocates 2GB memory for Node.js

## Building and Running

To build the Docker image:

```bash
# Using the simple Dockerfile
docker build -t nestjs-app -f Dockerfile.simple .

# Using the standard Dockerfile
docker build -t nestjs-app .
```

To run the container:

```bash
docker run -p 3000:3000 -d nestjs-app
```

## Environment Variables

You can pass environment variables to the container at runtime:

```bash
docker run -p 3000:3000 -e DATABASE_URL="postgresql://user:password@host:port/database" -d nestjs-app
```

## Deployment on Railway

For deploying on Railway, you can use the deployment scripts included in this project:

- `deploy-railway.sh` - Standard deployment script
- `deploy-minimal.sh` - Minimal deployment script

Railway will automatically use the Dockerfile specified in your configuration.

## Troubleshooting

If you encounter build issues:

- Ensure that the NestJS CLI is properly installed in the Dockerfile
- Check that bcrypt is being rebuilt from source
- Verify that all necessary environment variables are set
- Make sure the Prisma client is being generated correctly

For runtime issues:

- Check container logs with `docker logs <container_id>`
- Verify that the application is listening on the correct port
- Ensure that all required environment variables are available to the container 