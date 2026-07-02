const form = document.querySelector('#event-form');
const badRequestButton = document.querySelector('#bad-request');
const responseBox = document.querySelector('#response');
const notificationsBox = document.querySelector('#notifications');
const refreshButton = document.querySelector('#refresh');
const httpStatus = document.querySelector('#http-status');
const responseTime = document.querySelector('#response-time');
const trackingId = document.querySelector('#tracking-id');
const queueSize = document.querySelector('#queue-size');
const pendingCount = document.querySelector('#pending-count');
const completedCount = document.querySelector('#completed-count');
const failedCount = document.querySelector('#failed-count');
const refreshDbButton = document.querySelector("#refresh-db");

const stageIds = [
  'stage-validate',
  'stage-event',
  'stage-notification',
  'stage-queue',
  'stage-response',
  'stage-worker'
];



form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    event_type: formData.get('event_type'),
    recipient: formData.get('recipient'),
    data: {
      order_id: Number(formData.get('order_id'))
    }
  };

  await submitEvent(payload);
});

badRequestButton.addEventListener('click', async () => {
  await submitEvent({
    event_type: '',
    recipient: '',
    data: {
      order_id: 101
    }
  });
});

refreshButton.addEventListener('click', loadNotifications);

async function submitEvent(payload) {
  resetStages();
  setStage('stage-validate', 'active');
  responseBox.textContent = `Sending request:\n${JSON.stringify(payload, null, 2)}`;

  const startedAt = performance.now();
  const response = await fetch('/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const duration = Math.round(performance.now() - startedAt);
  const body = await response.json();

  httpStatus.textContent = `${response.status} ${response.statusText}`;
  responseTime.textContent = `${duration} ms`;
  trackingId.textContent = body.tracking_id || '-';
  responseBox.textContent = JSON.stringify(body, null, 2);

  if (!response.ok) {
    setStage('stage-validate', 'failed');
    return;
  }

  setStage('stage-validate', 'done');
  setStage('stage-event', 'done');
  setStage('stage-notification', 'done');
  setStage('stage-queue', 'done');
  setStage('stage-response', 'done');
  setStage('stage-worker', 'active');

  await loadNotifications(body.notification_id);
  waitForWorkerResult(body.notification_id);
}

async function waitForWorkerResult(notificationId) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await delay(500);
    const notifications = await loadNotifications(notificationId);
    const current = notifications.find((notification) => notification.id === notificationId);

    if (current && current.status !== 'pending') {
      setStage('stage-worker', current.status === 'completed' ? 'done' : 'failed');
      return;
    }
  }
}

async function loadNotifications(highlightId) {
  const response = await fetch('/api/v1/notifications');
  const body = await response.json();
  const notifications = body.notifications || [];

  queueSize.textContent = body.queue_size ?? 0;
  pendingCount.textContent = countByStatus(notifications, 'pending');
  completedCount.textContent = countByStatus(notifications, 'completed');
  failedCount.textContent = countByStatus(notifications, 'failed');

  if (notifications.length === 0) {
    notificationsBox.innerHTML = '<p class="empty">No notifications yet. Send an event to create one.</p>';
    return notifications;
  }

  notificationsBox.innerHTML = notifications.map((notification) => {
    
    const isHighlighted = notification.id === highlightId ? ' highlight' : '';

    return `
      <article class="notification${isHighlighted}">
        <div>
          <strong>Notification #${notification.id}</strong>
          <small>Event #${notification.event_id} - ${notification.event_type}</small>
        </div>
        <div>
          <span>${notification.recipient}</span>
          <small>channel: ${notification.channel}</small>
        </div>
        <span class="status ${notification.status}">${notification.status}</span>
        <div>
          <span>${notification.retry_count}</span>
          <small>retry_count</small>
        </div>
      </article>
    `;
  }).join('');

  return notifications;
}
async function loadEvents() {

    const eventResponse = await fetch('/api/v1/events');
    const notificationResponse = await fetch('/api/v1/notifications');

    const eventBody = await eventResponse.json();
    const notificationBody = await notificationResponse.json();

    const events = eventBody.events || [];
    const notifications = notificationBody.notifications || [];

    if (events.length === 0 || notifications.length === 0)
        return;

    const event = events[0];
    const notification = notifications[0];

    const payload = JSON.parse(event.payload);

    document.getElementById("event-id").textContent = event.id;
    document.getElementById("event-type").textContent = event.event_type;
    document.getElementById("event-recipient").textContent = payload.recipient;
    document.getElementById("event-order").textContent = payload.data.order_id;
    document.getElementById("event-created").textContent = event.created_at;

    document.getElementById("notification-id").textContent = notification.id;
    document.getElementById("notification-event-id").textContent = notification.event_id;
    document.getElementById("notification-recipient").textContent = notification.recipient;
    document.getElementById("notification-channel").textContent = notification.channel;
    document.getElementById("notification-retry").textContent = notification.retry_count;

    const status = document.getElementById("notification-status");
    status.textContent = notification.status;
    status.className = "status " + notification.status;
}
function countByStatus(notifications, status) {
  return notifications.filter((notification) => notification.status === status).length;
}

function resetStages() {
  stageIds.forEach((id) => {
    const stage = document.querySelector(`#${id}`);
    stage.classList.remove('active', 'done', 'failed');
  });
}

function setStage(id, state) {
  const stage = document.querySelector(`#${id}`);
  stage.classList.remove('active', 'done', 'failed');
  stage.classList.add(state);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

refreshDbButton.addEventListener("click", () => {
    loadEvents();
    loadNotifications();
});

refreshDbButton.addEventListener("click", () => {
    loadEvents();
});

loadEvents();

setInterval(() => {
    loadEvents();
    loadNotifications();
}, 1200);
