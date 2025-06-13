import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Todo.css";
import "../App.css";

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
      setApiOnline(true);
    } catch (err) {
      console.warn('API offline, using in-memory todos.');
      setApiOnline(false);
      setTodos([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    if (!apiOnline) {
      if (editingId) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo._id === editingId ? { _id: editingId, task, completed: todo.completed || false } : todo
          )
        );
      } else {
        const newId = `temp-${tempIdCounter}`;
        setTodos((prev) => [...prev, { _id: newId, task, completed: false }]);
        setTempIdCounter((id) => id + 1);
      }
    } else {
      try {
        if (editingId) {
          const res = await axios.put(`/api/todos/${editingId}`, { task });
          setTodos(todos.map((todo) => (todo._id === editingId ? res.data : todo)));
        } else {
          const res = await axios.post('/api/todos', { task });
          setTodos([...todos, res.data]);
        }
      } catch (err) {
        console.error('Error saving todo:', err);
        alert('Error communicating with the API. Switching to in-memory mode.');
        setApiOnline(false);
        handleSubmit(e); // retry in-memory fallback
        return;
      }
    }

    setTask('');
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!apiOnline || id.startsWith('temp-')) {
      setTodos((prev) => prev.filter((todo) => todo._id !== id));
    } else {
      try {
        await axios.delete(`/api/todos/${id}`);
        setTodos(todos.filter((todo) => todo._id !== id));
      } catch (err) {
        console.error('Error deleting todo:', err);
        alert('Error deleting. API offline. Switching to in-memory mode.');
        setApiOnline(false);
        handleDelete(id);
      }
    }
  };

  const handleToggleComplete = async (todo) => {
    const updatedTodo = { ...todo, completed: !todo.completed };

    if (!apiOnline || todo._id.startsWith('temp-')) {
      setTodos((prev) => prev.map((t) => (t._id === todo._id ? updatedTodo : t)));
    } else {
      try {
        const res = await axios.put(`/api/todos/${todo._id}`, {
          task: todo.task,
          completed: !todo.completed,
        });
        setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
      } catch (err) {
        console.error('Toggle complete failed:', err);
        alert('Error toggling complete. Switching to in-memory mode.');
        setApiOnline(false);
        setTodos(todos.map((t) => (t._id === todo._id ? updatedTodo : t)));
      }
    }
  };

  const handleEdit = (todo) => {
    setTask(todo.task);
    setEditingId(todo._id);
  };

  const cancelEdit = () => {
    setTask('');
    setEditingId(null);
  };

  return (
    <div className="todo-container">
      <h2 className="todo-header">{editingId ? 'Edit Todo' : 'Add Todo'}</h2>

      {!apiOnline && (
        <div className="todo-error">
          Offline mode: changes stored in memory only
        </div>
      )}

      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task"
          required
          className="form-input"
        />
        <div className="todo-actions">
          <button type="submit" className="todo-add-btn">
            {editingId ? 'Update Todo' : 'Add Todo'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="todo-cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="todo-header">Todo List</h3>
      {todos.length === 0 && <p className="todo-warning">No todos yet.</p>}

      {todos.map((todo) => (
        <div key={todo._id} className="todo-item">
          <span className={`todo-task ${todo.completed ? 'todo-done' : ''}`}>
            📋 {todo.task}
          </span>
          <div className="todo-actions">
            <button
              onClick={() => handleToggleComplete(todo)}
              className="todo-done-btn"
            >
              {todo.completed ? 'Undo' : 'Done'}
            </button>
            <button
              onClick={() => handleEdit(todo)}
              className="todo-edit-btn"
            >
            ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(todo._id)}
              className="todo-delete-btn"
            >
            🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
