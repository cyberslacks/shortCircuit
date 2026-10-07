FROM node:22-alpine
WORKDIR /app
COPY package.json server.js project-store.js circuit.js app.js mcp-server.js styles.css component-parts.css index.html ./
ENV HOST=0.0.0.0 PORT=4173
EXPOSE 4173
CMD ["npm", "start"]
