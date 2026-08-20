FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci -w backend

FROM backend-deps AS backend-build
COPY backend ./backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build -w backend

FROM node:20-alpine AS backend-prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci -w backend --omit=dev
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=backend/prisma/schema.prisma

FROM node:20-alpine AS backend-runtime
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=backend-prod-deps /app/node_modules /app/node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/tsconfig.json ./tsconfig.json
RUN mkdir -p uploads

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
