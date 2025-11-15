import React, { useState, useEffect } from 'react';
import { apiService, Event, EventsResponse } from '../services/api';
import EventDetailModal from './EventDetailModal';
import './EventList.css';

interface EventListProps {
  deviceId?: string;
  labelFilter?: string;
}

const EventList: React.FC<EventListProps> = ({ deviceId, labelFilter }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: EventsResponse = await apiService.getEvents(
        deviceId,
        labelFilter,
        pagination.limit,
        pagination.offset
      );
      setEvents(response.events);
      setPagination(prev => ({ ...prev, total: response.total }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [deviceId, labelFilter, pagination.offset]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handlePreviousPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && events.length === 0) {
    return <div className="event-list-loading">Cargando eventos...</div>;
  }

  if (error) {
    return <div className="event-list-error">Error: {error}</div>;
  }

  return (
    <>
      <div className="event-list-container">
        <div className="event-list-header">
          <h2>Eventos de Audio</h2>
          <div className="pagination-info">
            Mostrando {events.length} de {pagination.total} eventos
          </div>
        </div>

        {events.length === 0 ? (
          <div className="event-list-empty">No hay eventos disponibles</div>
        ) : (
          <>
            <table className="event-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Device ID</th>
                  <th>Label</th>
                  <th>Confidence</th>
                  <th>Duración (ms)</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="event-row"
                  >
                    <td>{formatDate(event.ts)}</td>
                    <td>{event.device_id}</td>
                    <td>
                      <span className="label-badge">{event.label}</span>
                    </td>
                    <td>{(event.confidence * 100).toFixed(1)}%</td>
                    <td>{event.duration_ms ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-controls">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.offset === 0}
                className="pagination-button"
              >
                Anterior
              </button>
              <span className="pagination-page">
                Página {Math.floor(pagination.offset / pagination.limit) + 1} de{' '}
                {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="pagination-button"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && selectedEvent && (
        <EventDetailModal eventId={selectedEvent.id} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default EventList;

