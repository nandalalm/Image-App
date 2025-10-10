# 🖼️ Image App

A full-stack **MERN** image management application built with modern architecture and best practices.  
Users can register, log in, upload multiple images, edit, delete, and reorder them via drag-and-drop — all within a secure and responsive interface.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- **User Registration with OTP Verification** (via **Nodemailer** and **Redis.io**)
- **JWT-based Authentication** (Access & Refresh Tokens)
- **Password Reset Functionality**
- **Profile Management** – users can add or update their profile photos.

### 🖼️ Image Management
- Bulk **image upload** with titles.
- **Image reordering** via drag-and-drop.
- **Edit** and **delete** images seamlessly.
- Images are stored securely in **AWS S3 Buckets**.

### 🧩 Architecture & Design
- **Repository Architecture** with clear separation of concerns.
- Follows **SOLID principles** and clean code structure.
- **Inversify** for dependency injection.
- **Best practices** implemented for scalability and maintainability.
- **NGINX** used as a reverse proxy.
- Hosted on **AWS**.

---

## 🧠 Tech Stack

### 🖥️ Frontend
- **React (Vite + TypeScript)**
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React DnD / drag-and-drop** for image ordering

### ⚙️ Backend
- **Node.js + Express.js**
- **MongoDB Atlas** for data storage
- **AWS S3** for image storage
- **Redis.io** for caching and OTP handling
- **Nodemailer** for sending OTP emails
- **InversifyJS** for dependency injection
- **JWT** for authentication
- **NGINX** for reverse proxy
- **Hosted on AWS**

---

## ⚙️ Environment Variables

### 🧩 Backend `.env`

```env
MONGO_URI=
PORT=5000

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
REDIS_URL=

EMAIL_USER=
EMAIL_PASS=

CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

```

### 🧩 Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api

```

🧰 Installation & Setup

🔹 Backend Setup

```
cd backend
npm install
npm run dev

```

🔹 Frontend Setup

```
cd frontend
npm install
npm run dev

```


