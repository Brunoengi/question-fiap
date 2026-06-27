FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --include-workspace-root
COPY backend/ ./backend/
RUN npm run build --workspace=backend

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --omit=dev --include-workspace-root
COPY --from=builder /app/backend/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
