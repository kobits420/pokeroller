const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8080;

// Debug log for API requests
app.use((req, res, next) => {
    console.log('INCOMING REQUEST:', req.method, req.url);
    next();
});

// Proxy API requests to your Node.js backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api'
    }
}));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Reverse proxy server running on port ${PORT}`);
    console.log(`Proxying API requests to http://localhost:3001`);
    console.log(`Access your site at: http://pokeroller.com:${PORT}`);
    console.log(`Server accessible from external devices`);
});