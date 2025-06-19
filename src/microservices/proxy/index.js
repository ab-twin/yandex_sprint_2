const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const {
    PORT = 8000,
    MONOLITH_URL = 'http://monolith:8080',
    MOVIES_SERVICE_URL = 'http://movies-service:8081',
    GRADUAL_MIGRATION = 'false',
    MOVIES_MIGRATION_PERCENT = '50',
} = process.env;

const app = express();
const percent = parseInt(MOVIES_MIGRATION_PERCENT, 10);

console.log(`Starting proxy on port ${PORT}`);
console.log(`Movies service: ${MOVIES_SERVICE_URL}`);
console.log(`Monolith service: ${MONOLITH_URL}`);
console.log(`Gradual migration: ${GRADUAL_MIGRATION}, percent: ${percent}%`);

function shouldUseNewService() {
    if (GRADUAL_MIGRATION !== 'true') return false;
    const rand = Math.random() * 100;
    return rand < percent;
}

// Proxy /api/movies*
app.use('/api/movies', (req, res, next) => {
    const useNew = shouldUseNewService();
    const target = useNew ? MOVIES_SERVICE_URL : MONOLITH_URL;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${target}`);
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' },
    })(req, res, next);
});

// Proxy everything else under /api/*
app.use('/api', createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    pathRewrite: { '^/api': '/api' },
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Proxy listening on port ${PORT}`);
});
