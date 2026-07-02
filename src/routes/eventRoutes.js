const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.post('/events', eventController.createEvent);
router.get('/events', eventController.listEvents);
router.get('/notifications', eventController.listNotifications);
router.get('/notifications/:id', eventController.getNotification);

module.exports = router;
