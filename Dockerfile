# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install build dependencies temporarily
RUN npm install --save-dev esbuild vite typescript @vitejs/plugin-react

# Copy source code
COPY . .

# Build the frontend (outputs to dist/public)
RUN npm run build

# Build the backend without vite dependencies (outputs to dist/index.prod.js)  
RUN npx esbuild server/index.prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.prod.js

# Remove dev dependencies to reduce image size (but keep required production deps)
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/index.prod.js"]