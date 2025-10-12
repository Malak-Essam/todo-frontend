const API_URL = 'http://localhost:8080/api'; // Assuming the backend runs on port 8080

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Page-specific logic
    if (document.body.contains(document.getElementById('login-form'))) {
        // On index.html
        if (token) {
            window.location.href = 'dashboard.html';
            return;
        }
        setupAuthForms();
    } else if (document.body.contains(document.getElementById('todo-list'))) {
        // On dashboard.html
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        setupDashboard();
    }
});

function setupAuthForms() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Network error: Could not connect to the API. Please ensure the backend server is running and there are no CORS issues.');
            } else {
                alert(error.message);
            }
        }
    });

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, email: email, password: password, role: 'USER', enabled: true }),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            alert('Registration successful! Please login.');
            showLogin.click(); // Switch to login form
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Network error: Could not connect to the API. Please ensure the backend server is running and there are no CORS issues.');
            } else {
                alert(error.message);
            }
        }
    });
}

function setupDashboard() {
    // --- DOM Elements ---
    const logoutBtn = document.getElementById('logout-btn');
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoListEl = document.getElementById('todo-list');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskListEl = document.getElementById('task-list');
    const tasksHeader = document.getElementById('tasks-header');

    // --- State ---
    const token = localStorage.getItem('token');
    let selectedListId = null;

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (title) {
            addTodoList(title);
            todoInput.value = '';
        }
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskInput.value.trim();
        if (title && selectedListId) {
            addTask(selectedListId, title);
            taskInput.value = '';
        }
    });

    // --- API Calls: Todo Lists ---
    const fetchTodoLists = async () => {
        try {
            const response = await fetch(`${API_URL}/lists`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch todo lists.');
            const lists = await response.json();
            renderTodoLists(lists);
        } catch (error) {
            alert(error.message);
        }
    };

    const addTodoList = async (title) => {
        try {
            const response = await fetch(`${API_URL}/lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: title, description: "" })
            });
            if (!response.ok) throw new Error('Could not add todo list.');
            fetchTodoLists();
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteTodoList = async (listId) => {
        try {
            const response = await fetch(`${API_URL}/lists/${listId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not delete todo list.');
            if (selectedListId === listId) {
                resetTaskView();
            }
            fetchTodoLists();
        } catch (error) {
            alert(error.message);
        }
    };

    // --- API Calls: Tasks ---
    const fetchTasks = async (listId) => {
        try {
            const response = await fetch(`${API_URL}/tasks/list/${listId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch tasks.');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            alert(error.message);
        }
    };

    const addTask = async (listId, title) => {
        try {
            const response = await fetch(`${API_URL}/tasks?listId=${listId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: title, description: "", status: "PENDING" })
            });
            if (!response.ok) throw new Error('Could not add task.');
            fetchTasks(listId);
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not delete task.');
            fetchTasks(selectedListId);
        } catch (error) {
            alert(error.message);
        }
    };

    // --- Rendering ---
    const renderTodoLists = (lists) => {
        todoListEl.innerHTML = '';
        lists.forEach(list => {
            const li = document.createElement('li');
            li.textContent = list.title;
            li.dataset.id = list.id;
            if (list.id === selectedListId) {
                li.classList.add('selected');
            }

            li.addEventListener('click', () => {
                selectedListId = list.id;
                tasksHeader.textContent = `Tasks in "${list.title}"`;
                taskForm.classList.remove('hidden');
                fetchTasks(list.id);
                // Update selected visual state
                document.querySelectorAll('#todo-list li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodoList(list.id);
            });

            li.appendChild(deleteBtn);
            todoListEl.appendChild(li);
        });
    };

    const renderTasks = (tasks) => {
        taskListEl.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title;
            li.dataset.id = task.id;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            li.appendChild(deleteBtn);
            taskListEl.appendChild(li);
        });
    };
    
    const resetTaskView = () => {
        selectedListId = null;
        tasksHeader.textContent = 'Select a list to see tasks';
        taskForm.classList.add('hidden');
        taskListEl.innerHTML = '';
    };

    // --- Initial Load ---
    fetchTodoLists();
}
