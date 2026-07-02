const database = require('../db/database');

const channel = 'email';

async function createNotification(event_id, recipient) {
  const status = 'pending';
  const result = await database.run(
    `INSERT INTO notifications (event_id, recipient, channel, status)
     VALUES (?, ?, ?, ?)`,
    [event_id, recipient, channel, status]
  );

  return {
    notification_id: result.id,
    event_id,
    recipient,
    channel,
    status
  };
}

async function markNotificationCompleted(notification_id) {
  await database.run(
    `UPDATE notifications
     SET status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [notification_id]
  );
}

async function markNotificationFailed(notification_id) {
  await database.run(
    `UPDATE notifications
     SET status = 'failed',
         retry_count = retry_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [notification_id]
  );
}

async function getNotification(notification_id) {
  return database.get('SELECT * FROM notifications WHERE id = ?', [notification_id]);
}

async function listNotifications() {
  return database.all(
    `SELECT n.*, e.event_type
     FROM notifications n
     JOIN events e ON e.id = n.event_id
     ORDER BY n.id DESC
     LIMIT 50`
  );
}

module.exports = {
  createNotification,
  markNotificationCompleted,
  markNotificationFailed,
  getNotification,
  listNotifications
};
