-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Dispositivos
CREATE TABLE devices (
                         device_id        TEXT PRIMARY KEY,           -- ej. "esp32s3_audio_001"
                         api_key_hash     TEXT NOT NULL,              -- hash del PSK (no guardes texto plano)
                         name             TEXT NOT NULL,
                         timezone         TEXT NOT NULL DEFAULT 'America/Mexico_City',
                         created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Eventos de audio clasificados por TinyML (mensajes "event_type": "sound_detected")
CREATE TABLE audio_events (
                              id               BIGSERIAL PRIMARY KEY,
                              device_id        TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
                              ts               TIMESTAMPTZ NOT NULL,       -- "timestamp" del payload
                              label            TEXT NOT NULL,              -- classification.label
                              confidence       REAL NOT NULL,              -- classification.confidence
                              alt_labels       JSONB NOT NULL DEFAULT '[]',-- classification.alternative_labels
                              duration_ms      INTEGER,                    -- audio_metrics.duration_ms
                              sample_rate      INTEGER,
                              rms_energy       REAL,
                              peak_amplitude   REAL,
                              clipping         BOOLEAN,
                              snr_db           REAL,
                              mfcc_summary     JSONB,                      -- feature_vector_summary (mean/std)
                              device_meta      JSONB,                      -- device_metadata completo
                              proc_stats       JSONB,                      -- processing_stats completo
                              raw_payload      JSONB NOT NULL,             -- TODO: payload completo como llegó
                              created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audio_events_device_ts ON audio_events(device_id, ts DESC);
CREATE INDEX idx_audio_events_label ON audio_events(label);
CREATE INDEX idx_audio_events_raw_gin ON audio_events USING GIN (raw_payload);

-- 3) Errores reportados por el dispositivo (message_type="error")
CREATE TABLE device_errors (
                               id               BIGSERIAL PRIMARY KEY,
                               device_id        TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
                               ts               TIMESTAMPTZ NOT NULL,       -- "timestamp"
                               code             TEXT NOT NULL,              -- error.code (ej. E_AUDIO_OVERRUN)
                               severity         TEXT NOT NULL,              -- "info"|"warning"|"critical"...
                               description      TEXT,
                               count            INTEGER,                    -- error.count
                               first_occurrence TIMESTAMPTZ,                -- error.first_occurrence
                               raw_payload      JSONB NOT NULL,
                               created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_errors_device_ts ON device_errors(device_id, ts DESC);
CREATE INDEX idx_device_errors_code ON device_errors(code);

-- 4) Agregados diarios simples (para gráficos rápidos)
-- Vista: total de eventos por día y etiqueta
CREATE OR REPLACE VIEW v_daily_label_counts AS
SELECT
    device_id,
    (ts AT TIME ZONE 'UTC')::date AS day_utc,
    label,
    COUNT(*) AS events
FROM audio_events
GROUP BY device_id, (ts AT TIME ZONE 'UTC')::date, label;

-- Vista: KPIs diarios por device (promedios y percentiles simples)
-- Nota: Para p95 real usa extensions/percentile_cont en consultas.
CREATE OR REPLACE VIEW v_daily_kpis AS
SELECT
    device_id,
    (ts AT TIME ZONE 'UTC')::date AS day_utc,
    COUNT(*)                     AS total_events,
    AVG(confidence)::float8     AS avg_confidence,
    AVG( (proc_stats->>'total_latency_ms')::float )::float8 AS avg_total_latency_ms
FROM audio_events
GROUP BY device_id, (ts AT TIME ZONE 'UTC')::date;
