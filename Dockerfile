# Etapa 1: Instalar dependencias
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar package.json y package-lock.json (o npm-shrinkwrap.json)
COPY package.json ./
# Descomenta la siguiente línea si tienes un package-lock.json
# COPY package-lock.json ./

# Instalar dependencias
RUN npm install

# Etapa 2: Compilar la aplicación
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para la compilación (si son necesarias)
# ENV NEXT_PUBLIC_API_URL=...

RUN npm run build

# Etapa 3: Imagen final de producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Crear un usuario y grupo no-root para ejecutar la aplicación
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar artefactos de compilación desde la etapa 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario no-root
USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
