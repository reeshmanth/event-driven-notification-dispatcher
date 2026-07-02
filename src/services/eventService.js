const database = require('../db/database');
const notificationService = require('./notificationService');
const queueWorker = require('./queueWorker');

async function createEvent({ event_type, recipient, data }) {
  const payload = JSON.stringify({ event_type, recipient, data });

  const eventResult = await database.run(
    'INSERT INTO events (event_type, payload) VALUES (?, ?)',
    [event_type, payload]
  );

  const event_id = eventResult.id;
  const notification = await notificationService.createNotification(event_id, recipient);
  const notification_id = notification.notification_id;
  const tracking_id = event_id;

  queueWorker.enqueueNotification({
    event_id,
    notification_id,
    recipient,
    data
  });

  return {
    message: 'Event accepted for processing',
    tracking_id,
    notification_id,
    status: notification.status
  };
}

async function getEvent(event_id) {
  return database.get('SELECT * FROM events WHERE id = ?', [event_id]);
}

async function listEvents() {
  return database.all('SELECT * FROM events ORDER BY id DESC LIMIT 50');
}

module.exports = {
  createEvent,
  getEvent,
  listEvents
};
