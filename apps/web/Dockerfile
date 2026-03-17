FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copiar manifiestos del monorepo (necesarios para que pnpm resuelva workspaces)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Instalar todas las dependencias del workspace
RUN pnpm install --no-frozen-lockfile

# Copiar código fuente
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]
