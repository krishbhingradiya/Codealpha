const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Restaurant Management System              ║
  ║   Server running on http://localhost:${PORT}    ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ╚══════════════════════════════════════════════╝
  `);
});
