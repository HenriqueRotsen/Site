const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  app.use(
    ['/auth', '/admin', '/client', '/health'],
    createProxyMiddleware({
      target: 'http://127.0.0.1:8788',
      changeOrigin: true,
    })
  );
};
