# Penn Campus Events

Penn Campus Events is a full-stack web application that serves as a centralized platform for students to discover, create, and manage campus events. Users of the application can browse events by category, date, and more. It allows users to RSVP through the platform and also join a waitlist if the event becomes full. So if a confirmed attendee cancels, the system promotes the next user in the waitlist, ensuring fair and structured access to event spots.

The goal of Penn Campus Events is to create a simplified, campus-focused version of
platforms like Eventbrite for students at Penn. This project will demonstrate
complete frontend-backend integration through user authentication, database
persistence, and real-time event status updates.

Below is a quick guide to get the backend up and running locally.

## **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/penn-campus-events.git
cd penn-campus-events/backend
```


## **2. Install Dependencies**


```bash
// Inside both frontend and backend folder
npm install
```


## **3. Create Your `.env` File**

Inside the `backend` folder, create a file named `.env`:

```
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_random_secret_string
```



## **4. Run the Server**

```bash
// Backend
node server.js

// Frontend
npm start
```

## **5. Authentication Flow**

### **Register**

`POST /auth/register`
Body:

```json
{
  "name": "test",
  "username": "test123",
  "email": "test@example.com",
  "password": "1234"
}
```

### **Login**

`POST /auth/login`
Body:

```json
{
  "username": "test123",
  "password": "1234"
}
```


## **6. Core Endpoints**

### **Create Event**

`POST /events/create`

Body:

```json
{
  "title": "Movie Night",
  "description": "Snacks + movie",
  "date": "2025-02-14T18:00:00.000Z",
  "time": "18:00",
  "location": "Houston Hall",
  "capacity": 50
}
```

Requires a valid JWT token.


### **RSVP for Event**

`POST /events/:eventId/rsvp`

Automatically:

* adds user to `attendees` or
* moves them to `waitlist` if capacity reached.

### **Get All Events**
`GET /events`

### **Get Event By ID**

`GET /events/:eventId`

## **7. Tech Stack**

### **Frontend**

* React + Vite
* React Router
* Tailwind CSS
* Framer Motion (animations)
* Fetch API networking

### **Backend**

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT authentication
* RESTful routes

