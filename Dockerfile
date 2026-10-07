FROM node:24-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run dev -- --hostname 0.0.0.0"]
