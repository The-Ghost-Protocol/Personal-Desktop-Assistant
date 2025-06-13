import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Note.css";
import "../App.css";

export default function Note() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get('/api/notes');
      setNotes(res.data);
      setApiOnline(true);
    } catch (err) {
      console.warn('API offline, using in-memory notes.');
      setApiOnline(false);
      setNotes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    if (!apiOnline) {
      if (editingId) {
        setNotes((prev) =>
          prev.map((n) =>
            n._id === editingId ? { _id: editingId, title, content } : n
          )
        );
      } else {
        const newId = `temp-${tempIdCounter}`;
        setNotes((prev) => [...prev, { _id: newId, title, content }]);
        setTempIdCounter((id) => id + 1);
      }
    } else {
      try {
        if (editingId) {
          const res = await axios.put(`/api/notes/${editingId}`, { title, content });
          setNotes(notes.map((n) => (n._id === editingId ? res.data : n)));
        } else {
          const res = await axios.post('/api/notes', { title, content });
          setNotes([...notes, res.data]);
        }
      } catch (err) {
        console.error('Error saving note:', err);
        alert('Error communicating with the API. Switching to in-memory mode.');
        setApiOnline(false);
        handleSubmit(e); // fallback
        return;
      }
    }

    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!apiOnline || id.startsWith('temp-')) {
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } else {
      try {
        await axios.delete(`/api/notes/${id}`);
        setNotes(notes.filter((n) => n._id !== id));
      } catch (err) {
        console.error('Error deleting note:', err);
        alert('Error deleting. API offline. Switching to in-memory mode.');
        setApiOnline(false);
        handleDelete(id);
      }
    }
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note._id);
  };

  const cancelEdit = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  return (
    <div className="note-container">
      <h2 className="note-header">
        {editingId ? 'Edit Note' : 'Add Note'}
      </h2>

      {!apiOnline && (
        <div className="note-error">
          Offline mode: changes stored in memory only
        </div>
      )}

      <form onSubmit={handleSubmit} className="note-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          required
          rows={4}
        />
        <div className="note-actions">
          <button type="submit" className="note-add-btn">
            {editingId ? 'Update Note' : 'Add Note'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="note-cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        {notes.length === 0 && <p className="note-empty">No notes yet.</p>}
        {notes.map((note) => (
          <div key={note._id} className="note-item">
            <h4>🗒️ {note.title}</h4>
            <p>{note.content}</p>
            <div className="note-actions">
              <button
                className="note-edit-btn"
                onClick={() => handleEdit(note)}
              >
              ✏️ Edit
              </button>
              <button
                className="note-delete-btn"
                onClick={() => handleDelete(note._id)}
              >
              🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
