const notificationService = require('./notificationService');

const notificationQueue = [];
let isProcessing = false;

function enqueueNotification(task) {
  notificationQueue.push(task);
  processQueue().catch((error) => {
    console.error('Queue processing failure:', error);
  });
}

function getQueueSize() {
  return notificationQueue.length;
}

async function processQueue() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  while (notificationQueue.length > 0) {
    const task = notificationQueue.shift();

    try {
      await simulateNotificationSend();

      if (Math.random() < 0.1) {
        throw new Error('Simulated notification failure');
      }

      await notificationService.markNotificationCompleted(task.notification_id);
    } catch (error) {
      console.error(`Notification ${task.notification_id} failed:`, error.message);

      try {
        await notificationService.markNotificationFailed(task.notification_id);
      } catch (updateError) {
        console.error('Notification update failure:', updateError);
      }
    }
  }

  isProcessing = false;
}

function simulateNotificationSend() {
  const delay = Math.floor(Math.random() * 501) + 500;

  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

module.exports = {
  enqueueNotification,
  getQueueSize
};
