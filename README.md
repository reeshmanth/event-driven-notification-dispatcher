# Event-Driven Notification Dispatcher

## Project Overview

The **Event-Driven Notification Dispatcher** is a lightweight asynchronous notification system developed using **Node.js**, **Express.js**, and **SQLite**.

The application exposes a REST API that accepts business events (such as `order_placed`), stores them in a SQLite database, creates a notification task, places the task into an **in-memory queue**, and immediately returns **HTTP 202 Accepted** without waiting for the notification to be processed.

A background worker processes queued notifications asynchronously, simulates notification delivery, and updates the notification status to either **completed** or **failed**.

---

# Features

- REST API built using Express.js
- SQLite database for persistent storage
- Event validation
- Asynchronous notification processing
- Native JavaScript in-memory queue
- Background worker
- Immediate HTTP 202 Accepted response
- Live dashboard for monitoring notifications
- Random notification processing delay (500–1000 ms)
- Simulated 10% notification failure rate
- Retry count tracking
- Proper error handling

---

# Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript Runtime |
| Express.js | REST API Framework |
| SQLite | Database |
| sqlite3 | SQLite Driver |
| JavaScript | Queue Implementation |
| HTML/CSS/JavaScript | Dashboard UI |

---

# Project Structure

```
project-root/
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── main.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── controllers/
│   │   └── eventController.js
│   │
│   ├── services/
│   │   ├── eventService.js
│   │   ├── notificationService.js
│   │   └── queueWorker.js
│   │
│   ├── routes/
│   │   └── eventRoutes.js
│   │
│   └── db/
│       ├── database.js
│       ├── notifications.sqlite
│       └── schema.sql
│
├── architecture-diagram.png
├── package.json
├── README.md
└── .env.example
```

---

# Installation

Clone the repository

```bash
git clone <repository-url>
```

Move into the project directory

```bash
cd Event-Notification
```

Install dependencies

```bash
npm install
```

---

# Database Setup

The application automatically creates the SQLite database when it starts.

Database schema is loaded from

```
src/db/schema.sql
```

No manual database configuration is required.

(Optional)

Create an environment file

```bash
copy .env.example .env
```

---

# Running the Application

Start the server

```bash
npm start
```

or

```bash
node src/server.js
```

Server starts on

```
http://localhost:3000
```

Open the dashboard in your browser

```
http://localhost:3000
```

---

# API Endpoint

## POST /api/v1/events

Triggers a business event and queues a notification for asynchronous processing.

### Request Body

```json
{
  "event_type": "order_placed",
  "recipient": "user@example.com",
  "data": {
    "order_id": 101
  }
}
```

---

### Successful Response

**HTTP Status**

```
202 Accepted
```

```json
{
  "message": "Event accepted for processing",
  "tracking_id": 1,
  "notification_id": 1,
  "status": "pending"
}
```

The API immediately returns this response while the notification is processed asynchronously in the background.

---

# Testing the API

### Using curl

```bash
curl -X POST http://localhost:3000/api/v1/events \
-H "Content-Type: application/json" \
-d '{
  "event_type":"order_placed",
  "recipient":"user@example.com",
  "data":{
    "order_id":101
  }
}'
```

---

# Additional API Endpoints

## Get All Events

```
GET /api/v1/events
```

Returns all stored events.

---

## Get All Notifications

```
GET /api/v1/notifications
```

Returns all notification records.

---

## Get Notification by ID

```
GET /api/v1/notifications/:id
```

Returns details of a specific notification.

---

# Database Schema

## Events Table

| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER | Primary Key |
| event_type | TEXT | Business event name |
| payload | TEXT | Event payload stored as JSON |
| created_at | DATETIME | Event creation timestamp |

---

## Notifications Table

| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER | Primary Key |
| event_id | INTEGER | Related event ID |
| recipient | TEXT | Notification recipient |
| channel | TEXT | Notification channel (email) |
| status | TEXT | pending / completed / failed |
| retry_count | INTEGER | Number of failed attempts |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

---

# How the Asynchronous Queue Works

### Step 1

The client sends a POST request to

```
POST /api/v1/events
```

---

### Step 2

Express validates

- event_type
- recipient

If validation fails, the API returns **400 Bad Request**.

---

### Step 3

The event is inserted into the **events** table.

---

### Step 4

A notification record is created in the **notifications** table with

```
status = pending
channel = email
```

---

### Step 5

The notification task is pushed into an **in-memory queue**.

---

### Step 6

The API immediately returns

```
202 Accepted
```

without waiting for notification processing.

---

### Step 7

A background worker continuously monitors the queue.

---

### Step 8

The worker processes notifications using

```
setTimeout()
```

with a random delay between

```
500 ms – 1000 ms
```

---

### Step 9

The worker simulates

- 90% Success
- 10% Failure

---

### Step 10

Finally, the notification status is updated to

```
completed
```

or

```
failed
```

If failed,

```
retry_count
```

is incremented.

---

# Error Handling

## Missing event_type

**HTTP Status**

```
400 Bad Request
```

```json
{
  "error":"event_type and recipient are required"
}
```

---

## Missing recipient

**HTTP Status**

```
400 Bad Request
```

```json
{
  "error":"event_type and recipient are required"
}
```

---

## Invalid JSON Payload

**HTTP Status**

```
400 Bad Request
```

```json
{
  "error":"Invalid JSON payload"
}
```

---

## Database Failure

**HTTP Status**

```
500 Internal Server Error
```

```json
{
  "error":"Internal server error"
}
```

---

## Queue Processing Failure

The API still returns

```
202 Accepted
```

because notification processing happens asynchronously.

The failure is logged and the worker handles the error gracefully.

---

## Notification Update Failure

If updating the notification status fails, the worker catches the error and logs it without crashing the application.

---

# Assumptions

- Default notification channel is **email**
- SQLite is used as the local database
- Notifications are simulated (no real email service)
- Queue is maintained entirely in memory
- Background worker starts automatically with the server

---

# Limitations

- Queue contents are lost if the server stops.
- Notifications are simulated using `setTimeout()`.
- Failed notifications increment `retry_count` but are not automatically retried.
- The application is intended for demonstration purposes and is not distributed across multiple servers.

---

# Architecture Diagram

The project includes an architecture diagram:

```
architecture-diagram.png
```

The diagram illustrates the complete application flow:

```
Client
      │
      ▼
POST /api/v1/events
      │
      ▼
Express API
      │
      ▼
Validate Request
      │
      ▼
Store Event (SQLite)
      │
      ▼
Create Notification (Pending)
      │
      ▼
Push Task to In-Memory Queue
      │
      ▼
Return HTTP 202 Accepted
      │
      ▼
Background Worker
      │
      ▼
Simulated Notification Sending
      │
      ▼
Update Notification Status
(completed / failed)
```

---

# Author

**Backend Engineering Technical Assessment**

**Event-Driven Notification Dispatcher**