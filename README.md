# Auralis Chat

Auralis Chat is a modern, full-stack AI conversational interface powered by the blazing-fast **Groq** API and **Meta's Llama 3** models. It features a sleek, responsive UI with light and dark mode support, image uploads, and real-time conversation history tracking.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Key Features](#key-features)
3. [Local Development Setup](#local-development-setup)
4. [Deployment Architecture](#deployment-architecture)

---

## Tech Stack

### **Frontend**
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

### **Backend & AI**
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Groq API](https://img.shields.io/badge/Groq%20API-f55036?style=for-the-badge&logo=groq&logoColor=white)

### **Database & Deployment**
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)

---

## Key Features
- **Lightning Fast AI:** Responses powered by Groq's LPU technology and Llama 3 70B.
- **Multimodal Support:** Upload images and analyze them seamlessly using Llama 3.2 Vision.
- **Persistent History:** Conversations are synced and saved in real-time via Firebase Firestore.
- **Dynamic Theming:** Built-in Light and Dark themes that sync with your system preferences.
- **Split Deployment:** Optimized for free-tier hosting with the frontend distributed globally on Firebase Hosting, and the backend running on Render.

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yash55-max/Chat.git
   cd Chat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```

4. **Start the local server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:3000`

## Deployment Architecture

This project uses a split-deployment strategy to keep operational costs at absolute zero while maintaining high performance:
- **Frontend Assets (`/public`)**: Deployed statically via **Firebase Hosting**.
- **Backend API (`server.js`)**: Deployed as a web service on **Render.com**. 
- **Storage/DB**: Managed by **Firebase (Firestore & Cloud Storage)**.
