# 🚀 Team Task Manager — MERN Stack

A full-stack web application for team collaboration with project management, task tracking, and role-based access control.

---

## 📁 Project Structure

```
team-task-manager/
├── README.md
├── backend/                         # Express + MongoDB API
│   ├── server.js                    # Entry point
│   ├── package.json
│   ├── .env.example                 # Environment variable template
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── roleCheck.js             # Role-based access middleware
│   ├── models/
│   │   ├── User.js                  # User schema (Admin/Member roles)
│   │   ├── Project.js               # Project schema
│   │   └── Task.js                  # Task schema with status tracking
│   ├── controllers/
│   │   ├── authController.js        # Signup, Login, Profile
│   │   ├── projectController.js     # CRUD for projects + members
│   │   └── taskController.js        # CRUD for tasks + assignments
│   └── routes/
│       ├── auth.js                  # /api/auth/*
│       ├── projects.js              # /api/projects/*
│       └── tasks.js                 # /api/tasks/*
│
└── frontend/                        # React app
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js                   # Router + auth guard
        ├── api/
        │   └── axios.js             # Axios instance with interceptors
        ├── context/
        │   └── AuthContext.js       # Global auth state
        ├── components/
        │   ├── Navbar.jsx           # Top navigation bar
        │   ├── Sidebar.jsx          # Side navigation menu
        │   ├── PrivateRoute.jsx     # Protected route wrapper
        │   ├── TaskCard.jsx         # Reusable task card component
        │   ├── ProjectCard.jsx      # Reusable project card
        │   ├── StatusBadge.jsx      # Task status badge
        │   └── Modal.jsx            # Reusable modal component
        ├── pages/
        │   ├── Login.jsx            # Login page
        │   ├── Register.jsx         # Registration page
        │   ├── Dashboard.jsx        # Overview with stats
        │   ├── Projects.jsx         # Projects list
        │   ├── ProjectDetail.jsx    # Project tasks & members
        │   └── Profile.jsx          # User profile
        └── utils/
            └── helpers.js           # Date formatting, status colors
```

---

## ⚙️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Axios    |
| Styling    | CSS Modules + Custom CSS Variables  |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose ODM              |
| Auth       | JWT (JSON Web Tokens) + bcryptjs    |
| Validation | express-validator                   |

---

## 🔐 Role-Based Access Control

| Feature                   | Admin | Member |
|---------------------------|-------|--------|
| Create Project            | ✅    | ❌     |
| Delete Project            | ✅    | ❌     |
| Add/Remove Members        | ✅    | ❌     |
| Create Task               | ✅    | ✅     |
| Assign Task to Others     | ✅    | ❌     |
| Update Task Status        | ✅    | ✅ (own tasks) |
| Delete Task               | ✅    | ❌     |
| View Dashboard            | ✅    | ✅     |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

### 3. Run the App

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

Open `http://localhost:3000`

---

## 📡 REST API Reference

### Auth
| Method | Endpoint             | Access  | Description        |
|--------|----------------------|---------|--------------------|
| POST   | /api/auth/register   | Public  | Register new user  |
| POST   | /api/auth/login      | Public  | Login & get token  |
| GET    | /api/auth/me         | Private | Get current user   |

### Projects
| Method | Endpoint                      | Access       | Description             |
|--------|-------------------------------|--------------|-------------------------|
| GET    | /api/projects                 | Private      | List all projects       |
| POST   | /api/projects                 | Admin        | Create project          |
| GET    | /api/projects/:id             | Member+      | Get project details     |
| PUT    | /api/projects/:id             | Admin        | Update project          |
| DELETE | /api/projects/:id             | Admin        | Delete project          |
| POST   | /api/projects/:id/members     | Admin        | Add member              |
| DELETE | /api/projects/:id/members/:uid| Admin        | Remove member           |

### Tasks
| Method | Endpoint                      | Access       | Description             |
|--------|-------------------------------|--------------|-------------------------|
| GET    | /api/tasks/project/:projectId | Member+      | List tasks in project   |
| POST   | /api/tasks                    | Member+      | Create task             |
| GET    | /api/tasks/:id                | Member+      | Get task details        |
| PUT    | /api/tasks/:id                | Member+      | Update task             |
| DELETE | /api/tasks/:id                | Admin        | Delete task             |
| GET    | /api/tasks/my-tasks           | Private      | Get my assigned tasks   |

---

## 🗂️ Data Models

### User
```js
{ name, email, password (hashed), role: ['admin'|'member'], createdAt }
```

### Project
```js
{ title, description, admin (ref:User), members:[{user, role}], status, deadline, createdAt }
```

### Task
```js
{ title, description, project (ref:Project), assignedTo (ref:User), createdBy (ref:User),
  status: ['todo'|'in-progress'|'review'|'done'], priority: ['low'|'medium'|'high'],
  dueDate, createdAt }
```

---

## 🌟 Key Features

- **JWT Authentication** — Secure token-based login/signup
- **Role-Based Access** — Admin vs Member permissions throughout
- **Project Management** — Create, update, manage team projects
- **Task Lifecycle** — Todo → In Progress → Review → Done
- **Task Assignment** — Assign tasks to team members
- **Dashboard** — Overview of tasks by status + overdue alerts
- **Overdue Detection** — Automatic flagging of past-due tasks
- **Responsive UI** — Works on desktop and mobile

---

## 📝 License

MIT
