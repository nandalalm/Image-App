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

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/image-app.git
cd image-app

```

### 2️⃣ Navigate to the backend folder and install dependencies

```bash
cd backend
npm install

```

### 3️⃣ Create a .env file in the backend directory and add the following environment variables

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

REDIS_URL=your_redis_connection_url

EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

```

### 4️⃣ Start the backend server

```bash
npm run dev

```

### 5️⃣ Navigate to the frontend folder and install dependencies

```bash
cd ../frontend
npm install

```

### 6️⃣ Create a .env file in the frontend directory and add the following

```env
VITE_API_BASE_URL=http://localhost:5000/api

```

### 7️⃣ Start the frontend development server

```bash
npm run dev

```

👨‍💻 Author

Nandalal M
Self-taught MERN Stack Developer

```
