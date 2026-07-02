require('dotenv').config();

const express = require('express');
const path = require('path');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/v1', eventRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON payload'
    });
  }

  return next(error);
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  return res.status(500).json({
    error: 'Internal server error'
  });
});

module.exports = app;
