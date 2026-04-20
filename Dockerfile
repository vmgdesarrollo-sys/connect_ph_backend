# Dockerfile para Connect PH Backend
# Optimizado para desarrollo y producción

# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/  # Si se usa Prisma en futuro

# Instalar dependencias (incluye devDependencies para build)
RUN npm ci --only=production

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules desde stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de la aplicación TypeScript → JavaScript
RUN npm run build

# Eliminar devDependencies
RUN npm ci --only=production && npm cache clean --force

# ===== Stage 3: Runner =====
FROM node:20-alpine AS runner
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar compiled code y node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3001

# Health check para Kubernetes/Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { if (r.statusCode !== 200) throw new Error('Not healthy') })"

# Comando por defecto
CMD ["node", "dist/main"]
