const API_URL = 'http://localhost:5555/api'; // Assuming the backend runs on port 5555

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
            // Step 1: Register the user
            const registerResponse = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, email: email, password: password, role: 'USER', enabled: true }),
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Registration failed.');
            }

            // Step 2: Automatically log in the new user
            const loginResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password }),
            });

            if (!loginResponse.ok) {
                // If auto-login fails, inform the user to log in manually
                alert('Registration successful! Please log in.');
                showLogin.click();
                return;
            }

            const loginData = await loginResponse.json();
            localStorage.setItem('token', loginData.token);
            window.location.href = 'dashboard.html'; // Redirect directly to the dashboard

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
    const listForm = document.getElementById('todo-form');
    const listInput = document.getElementById('todo-input');
    const listEl = document.getElementById('todo-list');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDueDate = document.getElementById('task-due-date');
    const taskListEl = document.getElementById('task-list');
    const tasksHeader = document.getElementById('tasks-header');

    // --- State ---
    const token = localStorage.getItem('token');
    let selectedList = null;

    // --- Generic API Fetch Function ---
    const apiFetch = async (endpoint, options = {}) => {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        const response = await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Request to ${endpoint} failed.`);
        }
        return response.status === 204 ? null : response.json();
    };

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    listForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = listInput.value.trim();
        if (title) {
            await apiFetch('/lists', { method: 'POST', body: JSON.stringify({ title }) });
            listInput.value = '';
            await fetchLists();
        }
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = taskInput.value.trim();
        let dueDate = taskDueDate.value;
        if (dueDate) {
            dueDate += 'T00:00:00'; // Append time to match LocalDateTime
        }
        if (title && selectedList) {
            await apiFetch(`/tasks?listId=${selectedList.id}`, { method: 'POST', body: JSON.stringify({ title, status: 'PENDING', dueDate }) });
            taskInput.value = '';
            taskDueDate.value = '';
            await fetchTasks(selectedList.id);
        }
    });

    // --- Core Functions ---
    const fetchLists = async () => {
        const lists = await apiFetch('/lists');
        renderLists(lists);
    };

    const fetchTasks = async (listId) => {
        const tasks = await apiFetch(`/tasks/list/${listId}`);
        renderTasks(tasks);
    };

    const makeEditable = (element, onSave) => {
        element.setAttribute('contenteditable', true);
        element.focus();
        const originalText = element.textContent;

        const save = async () => {
            element.removeAttribute('contenteditable');
            const newText = element.textContent.trim();
            if (newText && newText !== originalText) {
                try {
                    await onSave(newText);
                } catch (error) {
                    alert(`Error saving: ${error.message}`);
                    element.textContent = originalText; // Revert on failure
                }
            } else {
                element.textContent = originalText; // Revert if empty or unchanged
            }
        };

        element.addEventListener('blur', save);
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                element.textContent = originalText;
                element.removeAttribute('contenteditable');
            }
        });
    };

    // --- Rendering ---
    const renderLists = (lists) => {
        listEl.innerHTML = '';
        lists.forEach(list => {
            const li = document.createElement('li');
            li.dataset.id = list.id;
            if (selectedList && list.id === selectedList.id) {
                li.classList.add('selected');
            }

            const titleSpan = document.createElement('span');
            titleSpan.textContent = list.title;
            titleSpan.className = 'task-title';
            titleSpan.addEventListener('dblclick', () => {
                makeEditable(titleSpan, (newTitle) => 
                    apiFetch(`/lists/${list.id}`, { method: 'PUT', body: JSON.stringify({ ...list, title: newTitle }) })
                );
            });
            li.appendChild(titleSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await apiFetch(`/lists/${list.id}`, { method: 'DELETE' });
                if (selectedList && selectedList.id === list.id) {
                    resetTaskView();
                }
                await fetchLists();
            });
            li.appendChild(deleteBtn);

            li.addEventListener('click', () => {
                selectedList = list;
                tasksHeader.textContent = `Tasks in "${list.title}"`;
                taskForm.classList.remove('hidden');
                fetchTasks(list.id);
                document.querySelectorAll('#todo-list li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
            });

            listEl.appendChild(li);
        });
    };

    const renderTasks = (tasks) => {
        taskListEl.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'task-title';
            titleSpan.textContent = task.title;
            titleSpan.addEventListener('dblclick', () => {
                makeEditable(titleSpan, (newTitle) => 
                    apiFetch(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, title: newTitle }) })
                );
            });
            li.appendChild(titleSpan);

            if (task.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'due-date';
                dueDateSpan.textContent = ` (Due: ${new Date(task.dueDate).toLocaleDateString()})`;
                li.appendChild(dueDateSpan);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.addEventListener('click', async () => {
                await apiFetch(`/tasks/${task.id}`, { method: 'DELETE' });
                await fetchTasks(selectedList.id);
            });
            li.appendChild(deleteBtn);

            taskListEl.appendChild(li);
        });
    };
    
    const resetTaskView = () => {
        selectedList = null;
        tasksHeader.textContent = 'Select a list to see tasks';
        taskForm.classList.add('hidden');
        taskListEl.innerHTML = '';
    };

    // --- Initial Load ---
    fetchLists();
}
