import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Contacts.css";
import "../App.css";

const API_URL = 'http://localhost:5000/api/contacts';

export default function Contacts () {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(API_URL);
      const sorted = res.data.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setContacts(sorted);
      setError(null);
      setApiOnline(true);
    } catch (err) {
      console.warn('Offline mode: changes stored in memory only');
      setError('Offline mode: changes stored in memory only');
      setApiOnline(false);
      setContacts([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiOnline) {
      if (editingId) {
        setContacts((prev) =>
          prev.map((c) => (c._id === editingId ? { ...form, _id: editingId } : c))
        );
      } else {
        const tempId = `temp-${tempIdCounter}`;
        setContacts((prev) => [...prev, { ...form, _id: tempId }]);
        setTempIdCounter((c) => c + 1);
      }
      setForm({ name: '', email: '', phone: '' });
      setEditingId(null);
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      setForm({ name: '', email: '', phone: '' });
      setEditingId(null);
      fetchContacts();
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Failed to submit. API might be offline.');
      setApiOnline(false);
    }
  };

  const handleEdit = (contact) => {
    setForm(contact);
    setEditingId(contact._id);
  };

  const handleDelete = async (id) => {
    if (!apiOnline) {
      setContacts((prev) => prev.filter((c) => c._id !== id));
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('Failed to delete contact.');
      setApiOnline(false);
    }
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {});

  return (
    <div className="contact-container">
      <h2 className="contact-header">📒 Address Book</h2>

      {error && (
        <div className="contact-error">
          <div>{error}</div>
        </div>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="form-input"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="form-input"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <div className="contact-actions">
          <button type="submit" className="contact-add-btn">
            {editingId ? 'Update' : 'Add'} Contact
          </button>
          {editingId && (
            <button
              type="button"
              className="contact-cancel-btn"
              onClick={() => {
                setForm({ name: '', email: '', phone: '' });
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {contacts.length === 0 ? (
        <div className="contact-empty">No contacts found.</div>
      ) : (
        Object.keys(groupedContacts)
          .sort()
          .map((letter) => (
            <div key={letter} className="contact-group">
              <h3 className="contact-letter">{letter}</h3>
                {groupedContacts[letter].map((contact) => (
                  <div key={contact._id} className="contact-item">
                    <div className="event-title">{contact.name}</div>
                    <div className="contact-info">📧 {contact.email}</div>
                    <div className="contact-info">📞 {contact.phone}</div>
                    <div className="contact-actions">
                      <button
                        className="contact-edit-btn"
                        onClick={() => handleEdit(contact)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="contact-delete-btn"
                        onClick={() => handleDelete(contact._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))
      )}
    </div>
  );
}
