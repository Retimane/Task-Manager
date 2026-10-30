// 1. Find the things on the page
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const dueInput = document.querySelector('#due-input');
const list = document.querySelector('#task-list');
const counter = document.querySelector('#counter');
const clearDoneButton = document.querySelector('#clear-done');
const filterButtons = document.querySelectorAll('.filter');


// 2. Saving and loading (the browser's drawer)
const STORAGE_KEY = 'task-manager-tasks';

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Could not save tasks', error);
  }
}

// 3. Our memory
let tasks = loadTasks();
let currentFilter = 'all';
let editingId = null;

const emptyMessages = {
  all: 'No tasks yet. Add your first one!',
  active: 'Nothing left to do. Nice work!',
  done: 'No finished tasks yet.',
};

// 4. Recipes
function getVisibleTasks() {
  if (currentFilter === 'active') return tasks.filter((task) => !task.done);
  if (currentFilter === 'done') return tasks.filter((task) => task.done);
  return tasks;
}
function formatDue(due) {
  return new Date(due).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(task) {
  return Boolean(task.due) && !task.done && new Date(task.due) < new Date();
}
function saveEdit(task, newText) {
  const trimmed = newText.trim();
  if (trimmed !== '') task.text = trimmed;
  editingId = null;
  render();
}

function render() {
  saveTasks();
  list.replaceChildren();

  const visibleTasks = getVisibleTasks();
  let inputToFocus = null;

  if (visibleTasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = emptyMessages[currentFilter];
    list.append(empty);
  }

  visibleTasks.forEach((task) => {
    const isEditing = task.id === editingId;

    const li = document.createElement('li');
    li.className = task.done ? 'task done' : 'task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark as done');
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      render();
    });

    let content;
    if (isEditing) {
      content = document.createElement('input');
      content.type = 'text';
      content.value = task.text;
      content.className = 'edit-input';
      content.setAttribute('aria-label', 'Edit task');
      content.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveEdit(task, content.value);
        if (event.key === 'Escape') {
          editingId = null;
          render();
        }
      });
      inputToFocus = content;
    } else {
      content = document.createElement('span');
      content.textContent = task.text;
            content.addEventListener('dblclick', () => {
        editingId = task.id;
        render();
      });
    }

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = isEditing ? 'Save' : 'Edit';
    editButton.addEventListener('click', () => {
      if (isEditing) {
        saveEdit(task, content.value);
        return;
      }

      const openBox = list.querySelector('.edit-input');
      if (openBox) {
        const openTask = tasks.find((t) => t.id === editingId);
        if (openTask && openBox.value.trim() !== '') openTask.text = openBox.value.trim();
      }

      editingId = task.id;
      render();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      render();
    });

    const body = document.createElement('div');
    body.className = 'task-body';
    body.append(content);

    if (task.due) {
      const overdue = isOverdue(task);
      const due = document.createElement('small');
      due.className = overdue ? 'due overdue' : 'due';
      due.textContent = (overdue ? 'Overdue: ' : 'Due ') + formatDue(task.due);
      body.append(due);
    }

    li.append(checkbox, body, editButton, deleteButton);
    list.append(li);
  });

  if (inputToFocus) {
    inputToFocus.focus();
    inputToFocus.select();
  }

  const left = tasks.filter((task) => !task.done).length;
  counter.textContent = left === 1 ? '1 task left' : left + ' tasks left';

  clearDoneButton.disabled = !tasks.some((task) => task.done);
}

// 5. Things the user can do
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((other) => {
      other.classList.toggle('active', other === button);
    });

    render();
  });
});
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((other) => {
      other.classList.toggle('active', other === button);
    });

    render();
  });
});

clearDoneButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.done);
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (text === '') return;

    tasks.push({ id: Date.now(), text: text, done: false, due: dueInput.value });

  input.value = '';
  dueInput.value = '';
  input.focus();
  render();
});

// 6. Draw once at the start
render();
// Every minute, check again if anything became overdue
setInterval(() => {
  if (editingId === null) render();
}, 60000);