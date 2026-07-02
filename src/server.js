require('dotenv').config();

const app = require('./app');
const { initializeDatabase } = require('./db/database');

const port = process.env.PORT || 3000;

async function startServer() {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Notification dispatcher running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
