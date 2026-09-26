const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start HTTP Server
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Clinic Appointment Manager API Server`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Running on: http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(' [Unhandled Rejection]:', err.name, err.message);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(' [Uncaught Exception]:', err.name, err.message);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
