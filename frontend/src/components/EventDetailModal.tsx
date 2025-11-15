import React, { useState, useEffect } from 'react';
import { apiService, EventDetail } from '../services/api';
import './EventDetailModal.css';

interface EventDetailModalProps {
  eventId: number;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ eventId, onClose }) => {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEventDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const eventData = await apiService.getEventById(eventId);
        setEvent(eventData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [eventId]);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalles del Evento #{eventId}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading && <div className="modal-loading">Cargando...</div>}
          {error && <div className="modal-error">Error: {error}</div>}
          {event && (
            <>
              <div className="detail-section">
                <h3>Información Básica</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Device ID:</span>
                    <span className="detail-value">{event.device_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Timestamp:</span>
                    <span className="detail-value">{formatDate(event.ts)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Label:</span>
                    <span className="detail-value">
                      <span className="label-badge">{event.label}</span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Confidence:</span>
                    <span className="detail-value">{(event.confidence * 100).toFixed(2)}%</span>
                  </div>
                  {event.alt_labels && event.alt_labels.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Etiquetas Alternativas:</span>
                      <span className="detail-value">
                        {event.alt_labels.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Métricas de Audio</h3>
                <div className="detail-grid">
                  {event.duration_ms !== null && (
                    <div className="detail-item">
                      <span className="detail-label">Duración:</span>
                      <span className="detail-value">{event.duration_ms} ms</span>
                    </div>
                  )}
                  {event.sample_rate !== null && (
                    <div className="detail-item">
                      <span className="detail-label">Sample Rate:</span>
                      <span className="detail-value">{event.sample_rate} Hz</span>
                    </div>
                  )}
                  {event.rms_energy !== null && (
                    <div className="detail-item">
                      <span className="detail-label">RMS Energy:</span>
                      <span className="detail-value">{event.rms_energy.toFixed(4)}</span>
                    </div>
                  )}
                  {event.peak_amplitude !== null && (
                    <div className="detail-item">
                      <span className="detail-label">Peak Amplitude:</span>
                      <span className="detail-value">{event.peak_amplitude.toFixed(4)}</span>
                    </div>
                  )}
                  {event.snr_db !== null && (
                    <div className="detail-item">
                      <span className="detail-label">SNR:</span>
                      <span className="detail-value">{event.snr_db.toFixed(2)} dB</span>
                    </div>
                  )}
                  {event.clipping !== null && (
                    <div className="detail-item">
                      <span className="detail-label">Clipping:</span>
                      <span className="detail-value">{event.clipping ? 'Sí' : 'No'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Payload Completo (JSON)</h3>
                <pre className="json-payload">
                  {JSON.stringify(event.raw_payload, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;

