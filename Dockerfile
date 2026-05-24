FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=build /app/dist ./dist
COPY server ./server
COPY types.ts ./types.ts
COPY tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["npm", "run", "start"]
