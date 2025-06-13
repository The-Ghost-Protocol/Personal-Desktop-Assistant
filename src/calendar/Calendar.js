// Calendar.js
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import "./Calendar.css";
import "../App.css";

const API_BASE = 'http://localhost:3001/api';

const eventTypes = [
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { value: 'reminder', label: 'Reminder', color: 'bg-green-500', textColor: 'text-green-700' },
  { value: 'task', label: 'Task', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  { value: 'event', label: 'Event', color: 'bg-purple-500', textColor: 'text-purple-700' },
  { value: 'personal', label: 'Personal', color: 'bg-pink-500', textColor: 'text-pink-700' }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'meeting'
  });

  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'meeting'
  });

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setError('');
      } else {
        setError('Failed to load calendar events');
      }
    } catch (err) {
      setError('Offline mode: changes stored in memory only');
    } finally {
      setLoading(false);
    }
  };

  // Create new event
  const createEvent = async () => {
    if (!newEvent.title.trim()) return;
    
    try {
      const eventData = {
        ...newEvent,
        datetime: `${newEvent.date}T${newEvent.startTime}:00`,
        endDatetime: `${newEvent.date}T${newEvent.endTime}:00`
      };
      
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        setNewEvent({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          type: 'meeting'
        });
        setShowCreateForm(false);
        fetchEvents();
      } else {
        setError('Failed to create event');
      }
    } catch (err) {
      setError('Failed to create event - Network error');
    }
  };

  // Update event
  const updateEvent = async (id) => {
    try {
      const eventData = {
        ...editEvent,
        datetime: `${editEvent.date}T${editEvent.startTime}:00`,
        endDatetime: `${editEvent.date}T${editEvent.endTime}:00`
      };
      
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        setEditingId(null);
        setEditEvent({
          title: '',
          description: '',
          date: '',
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          type: 'meeting'
        });
        fetchEvents();
      } else {
        setError('Failed to update event');
      }
    } catch (err) {
      setError('Failed to update event - Network error');
    }
  };

  // Delete event
  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchEvents();
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('Failed to delete event - Network error');
    }
  };

  // Start editing
  const startEdit = (event) => {
    const eventDate = new Date(event.datetime || event.createdAt);
    const endDate = event.endDatetime ? new Date(event.endDatetime) : new Date(eventDate.getTime() + 60 * 60 * 1000);
    
    setEditingId(event._id);
    setEditEvent({
      title: event.title || event.name || '',
      description: event.description || '',
      date: eventDate.toISOString().split('T')[0],
      startTime: eventDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      location: event.location || '',
      type: event.type || event.category || 'meeting'
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditEvent({
      title: '',
      description: '',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      type: 'meeting'
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.datetime ? 
        new Date(event.datetime).toISOString().split('T')[0] : 
        new Date(event.createdAt).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventTypeInfo = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <div className="header-left">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <h1 className="header-title">Calendar</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="create-button"
            >
              <Plus size={18} />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-text">{error}</span>
          </div>
        </div>
      )}
      
      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="controls-container">
          <div className="controls-header">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToToday}
                className="today-button"
              >
                Today
              </button>

              <div className="navigation-buttons">
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth(-1) : viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}
                  className="nav-button"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth(1) : viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}
                  className="nav-button"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h2 className="current-month">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                  ...(viewMode === 'day' && { day: 'numeric' })
                })}
              </h2>
            </div>

            <div className="view-buttons">
              {['month', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`view-button ${viewMode === mode ? 'active' : 'inactive'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="month-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="day-header">
                  {day}
                </div>
              ))}

              {generateCalendarDays().map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                const isToday = day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`day-cell ${!day.isCurrentMonth ? 'not-current' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className={`day-number ${isToday ? 'today' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="event-list">
                      {dayEvents.slice(0, 3).map(event => {
                        const typeInfo = getEventTypeInfo(event.type || event.category);
                        return (
                          <div
                            key={event._id}
                            className={`event-item ${typeInfo.color}`}
                            onClick={() => startEdit(event)}
                          >
                            {event.title || event.name}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="more-events">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week/Day View */}
          {(viewMode === 'week' || viewMode === 'day') && (
            <div className="event-list-view">
              {events
                .filter(event => {
                  const eventDate = new Date(event.datetime || event.createdAt);
                  if (viewMode === 'day') {
                    return eventDate.toDateString() === currentDate.toDateString();
                  } else {
                    const weekStart = new Date(currentDate);
                    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return eventDate >= weekStart && eventDate <= weekEnd;
                  }
                })
                .map(event => {
                  const typeInfo = getEventTypeInfo(event.type || event.category);
                  const eventDate = new Date(event.datetime || event.createdAt);
                  const endDate = event.endDatetime ? new Date(event.endDatetime) : null;

                  return (
                    <div key={event._id} className="event-card">
                      {editingId === event._id ? (
                        // Edit Mode
                        <div className="edit-form">
                          <div className="form-grid">
                            <input
                              type="text"
                              placeholder="Event title"
                              value={editEvent.title}
                              onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                              className="form-input"
                            />
                            <input
                              type="date"
                              value={editEvent.date}
                              onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                              className="form-input"
                            />
                            <select
                              value={editEvent.startTime}
                              onChange={(e) => setEditEvent({ ...editEvent, startTime: e.target.value })}
                              className="form-input"
                            >
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{formatTime(time)}</option>
                              ))}
                            </select>
                            <select
                              value={editEvent.endTime}
                              onChange={(e) => setEditEvent({ ...editEvent, endTime: e.target.value })}
                              className="form-input"
                            >
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{formatTime(time)}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Location (optional)"
                              value={editEvent.location}
                              onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                              className="form-input"
                            />
                            <select
                              value={editEvent.type}
                              onChange={(e) => setEditEvent({ ...editEvent, type: e.target.value })}
                              className="form-input"
                            >
                              {eventTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            placeholder="Description (optional)"
                            value={editEvent.description}
                            onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                            className="form-textarea"
                            rows={3}
                          />
                          <div className="form-actions">
                            <button
                              onClick={() => updateEvent(event._id)}
                              className="save-button"
                            >
                              <Save size={16} />
                              <span>Update</span>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="cancel-button"
                            >
                              <X size={16} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="event-header">
                              <h3 className="event-title">{event.title || event.name}</h3>
                              <span className={`event-type ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>

                            <div className="event-details">
                              <div className="event-detail-row">
                                <Clock size={14} />
                                <span>
                                  {eventDate.toLocaleDateString()} • {formatTime(eventDate.toTimeString().slice(0, 5))}
                                  {endDate && ` - ${formatTime(endDate.toTimeString().slice(0, 5))}`}
                                </span>
                              </div>

                              {event.location && (
                                <div className="event-detail-row">
                                  <MapPin size={14} />
                                  <span>{event.location}</span>
                                </div>
                              )}

                              {event.description && (
                                <p className="mt-2 text-gray-700">{event.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="event-actions">
                            <button
                              onClick={() => startEdit(event)}
                              className="action-button edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteEvent(event._id)}
                              className="action-button delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {((viewMode === 'day' && !events.some(e => new Date(e.datetime || e.createdAt).toDateString() === currentDate.toDateString())) ||
                (viewMode === 'week' && !events.some(e => {
                  const eventDate = new Date(e.datetime || e.createdAt);
                  const weekStart = new Date(currentDate);
                  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  return eventDate >= weekStart && eventDate <= weekEnd;
                }))) && (
                <div className="empty-state">
                  No events scheduled for this {viewMode}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Event</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="form-input"
              />

              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="form-input"
              />

              <div className="form-grid">
                <select
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="form-input"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{formatTime(time)}</option>
                  ))}
                </select>

                <select
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="form-input"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{formatTime(time)}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Location (optional)"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="form-input"
              />

              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="form-input"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="modal-footer">
              <button
                onClick={createEvent}
                className="create-button-primary"
              >
                Create Event
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="create-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}