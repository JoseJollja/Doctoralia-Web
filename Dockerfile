# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias Y la configuración de Prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./ 

# Instalamos TODAS las dependencias (incluyendo CLI de Prisma)
RUN npm ci

COPY . .

# Generamos el cliente con DATABASE_URL dummy
# Prisma necesita que la variable exista para validar la config, aunque no se conecte.
# Al estar en alpine y tener binaryTargets, bajará el motor correcto (linux-musl).
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=clinic"
RUN npx prisma generate

# Compilamos NestJS
RUN npm run build

# Copiamos el cliente generado a dist para que las rutas relativas funcionen en runtime
RUN cp -r src/generated dist/generated

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Copiamos package files
COPY --from=builder /app/package*.json ./

# Copiamos TODO node_modules desde el builder (incluye el cliente generado y todas sus dependencias)
COPY --from=builder /app/node_modules ./node_modules

# Copiamos la aplicación compilada
COPY --from=builder /app/dist ./dist

# Copiamos la carpeta prisma por si la app los necesita en runtime
COPY --from=builder /app/prisma ./prisma

# El cliente generado ya está en dist/generated (copiado durante el build)
COPY data ./data

# DATABASE_URL será proporcionado por docker-compose en runtime
ENV NODE_ENV=production
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/main.js"]