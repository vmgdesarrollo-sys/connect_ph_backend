# Dockerfile para Connect PH Backend
# Optimizado para desarrollo y producción

# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluye devDependencies para build)
RUN npm install --omit=dev

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar todos los archivos
COPY . .

# Instalar todas las dependencias (incluye dev para nest CLI)
RUN npm install

# Build de la aplicación TypeScript → JavaScript
RUN npm run build

# Eliminar devDependencies
RUN npm install --omit=dev && npm cache clean --force

# ===== Stage 3: Runner =====
FROM node:20-alpine AS runner
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar compiled code, node_modules y archivos i18n
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/src/i18n ./src/i18n

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3001

# Health check para Kubernetes/Cloud Run
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando por defecto
CMD ["node", "dist/main"]
