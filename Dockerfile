# biblioteca-eventos: dos etapas sobre node:24-slim (Paso 7 de la E2).
# Etapa 1: compila con todas las dependencias, incluidas las de desarrollo (nest, typescript).
# Sin ellas, `npm run build` falla con «nest: not found».
FROM node:24-slim AS build
WORKDIR /app
# Primero solo las dependencias: mientras package-lock.json no cambie, Docker reusa esta capa.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: solo lo que corre en produccion, sin ser root.
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3010
CMD ["node", "dist/main.js"]
