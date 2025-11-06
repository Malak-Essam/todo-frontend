# 📝 Todo List Frontend  

A simple **frontend web application** for managing todo lists and tasks.  
Built with **HTML**, **CSS**, and **vanilla JavaScript**, this project connects to a backend API for authentication and CRUD operations.  

---

## 🚀 Features  

### 🔐 Authentication  
- Register new users  
- Login with existing credentials  
- Token-based authentication stored in `localStorage`  
- Auto redirect between login and dashboard based on authentication status  

### 📋 Todo Lists  
- Create, rename, and delete todo lists  
- Click a list to view its tasks  
- Inline editing with double-click  

### ✅ Tasks  
- Add, edit, and delete tasks  
- Assign due dates  
- Display due date in readable format  

### 💾 Persistent Data  
- All operations (lists and tasks) are synced with a backend REST API  

---

## 🧩 Tech Stack  

| Component | Technology |
|------------|-------------|
| Frontend | HTML, CSS, JavaScript |
| API Communication | Fetch API |
| Auth | JWT stored in `localStorage` |
| Styling | Responsive layout with Flexbox and media queries |

---

## ⚙️ Project Structure  

```
📂 project-root
│
├── index.html         # Login & Register page
├── dashboard.html     # Main todo dashboard
├── app.js             # All JavaScript logic (auth, CRUD, rendering)
├── style.css          # Styling for all pages
└── README.md          # Documentation
```

---

## 🔗 Backend Connection  

This frontend connects to the backend API at:  

```
https://todolist-black-sun-6679-production.up.railway.app/api
```

You can modify the API URL in `app.js` if your backend runs locally:  

```js
const API_URL = 'http://localhost:5555/api';
```

---

## 🧠 How It Works  

1. On page load, the script checks if a token exists in `localStorage`.  
   - If yes → redirect to `dashboard.html`.  
   - If no → stay on `index.html`.  

2. Users can register or log in.  
   - On success, the JWT token is stored locally.  

3. On the dashboard:  
   - Lists and tasks are fetched from the backend using the token.  
   - CRUD operations call the API through a helper function `apiFetch()`.  
   - Tasks are editable via double-click (inline editing).  

4. Logout removes the token and redirects back to login.  

---

## 🧑‍💻 Setup & Usage  

### 1. Clone the repository  
```bash
git clone https://github.com/yourusername/todo-frontend.git
cd todo-frontend
```

### 2. Run the backend  
Make sure your backend (Spring Boot or other) is running and accessible at the `API_URL`.  

### 3. Run the frontend  
You can open `index.html` directly in your browser, or serve it locally:  

```bash
# Using VS Code Live Server
# or
python -m http.server 5500
```

Visit:  
```
http://localhost:5500
```

---

## 🧾 API Endpoints Used  

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/auth/register` | POST | Create a new user |
| `/auth/login` | POST | Authenticate user and return JWT |
| `/lists` | GET | Get all lists |
| `/lists` | POST | Create new list |
| `/lists/{id}` | PUT | Update list |
| `/lists/{id}` | DELETE | Delete list |
| `/tasks/list/{listId}` | GET | Get all tasks in a list |
| `/tasks?listId={id}` | POST | Add task to a list |
| `/tasks/{id}` | PUT | Update task |
| `/tasks/{id}` | DELETE | Delete task |

---

## 🧰 Key Functions  

| Function | Purpose |
|-----------|----------|
| `setupAuthForms()` | Handles login/register form logic |
| `setupDashboard()` | Initializes dashboard events |
| `apiFetch(endpoint, options)` | Authenticated API request helper |
| `fetchLists()` | Loads all todo lists |
| `fetchTasks(listId)` | Loads all tasks in a list |
| `makeEditable(element, onSave)` | Enables inline editing |

---

## 🎨 UI Highlights  

- Clean, minimal design using **Poppins** font  
- Responsive layout for desktop and mobile  
- Smooth transitions between login, register, and dashboard views  

---

## 🧑‍🏫 Future Improvements  

- Add task completion toggle  
- Add task filtering by status or date  
- Add notifications for due tasks  
- Dark mode  

---

## 🪪 License  

This project is open source and available under the [MIT License](LICENSE).  
