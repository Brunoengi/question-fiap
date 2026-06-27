FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend --include-workspace-root
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend --omit=dev --include-workspace-root
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY frontend/next.config.ts ./frontend/
EXPOSE 3000
WORKDIR /app/frontend
CMD ["npx", "next", "start"]
