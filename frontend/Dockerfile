# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# We use NEXT_PUBLIC_API_URL during build time for Next.js to bake it into the client-side code
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 8080

# Copy necessary files from builder
COPY --from:builder /app/next.config.ts ./
COPY --from:builder /app/public ./public
COPY --from:builder /app/.next ./.next
COPY --from:builder /app/node_modules ./node_modules
COPY --from:builder /app/package.json ./package.json

EXPOSE 8080

CMD ["npm", "start"]
