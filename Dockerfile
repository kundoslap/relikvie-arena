# For hosts that build from a Dockerfile (Fly.io, Railway, Koyeb, a VPS). Render uses render.yaml instead.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js db.js meta.js stats.js ./
COPY public ./public
RUN mkdir -p data && chown node:node data
USER node
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
