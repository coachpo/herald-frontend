FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

ARG PNPM_VERSION=10.29.3
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_URL=http://localhost:8100
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build

FROM nginx:alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3100

CMD ["nginx", "-g", "daemon off;"]
