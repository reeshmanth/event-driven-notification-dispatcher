const eventService = require('../services/eventService');
const notificationService = require('../services/notificationService');
const queueWorker = require('../services/queueWorker');

async function createEvent(req, res) {
  const { event_type, recipient, data = {} } = req.body || {};

  if (!event_type || !recipient) {
    return res.status(400).json({
      error: 'event_type and recipient are required'
    });
  }

  try {
    const response = await eventService.createEvent({ event_type, recipient, data });
    return res.status(202).json(response);
  } catch (error) {
    console.error('Database insert failure:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

async function listEvents(req, res) {
  try {
    const events = await eventService.listEvents();
    return res.json({ events });
  } catch (error) {
    console.error('Failed to list events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function listNotifications(req, res) {
  try {
    const notifications = await notificationService.listNotifications();
    return res.json({
      queue_size: queueWorker.getQueueSize(),
      notifications
    });
  } catch (error) {
    console.error('Failed to list notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getNotification(req, res) {
  try {
    const notification = await notificationService.getNotification(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ notification });
  } catch (error) {
    console.error('Failed to get notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createEvent,
  listEvents,
  listNotifications,
  getNotification
};
