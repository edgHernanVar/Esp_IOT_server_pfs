import {Pool} from "pg";

interface DeviceErrorPayload {
    device_id: string;
    timestamp: string;
    message_type: 'error';
    error: {
        code: string;
        severity: string;
        description?: string;
        count?: number;
        first_occurrence?: string;
    };
    [key: string]: unknown;
}

interface AudioEventPayload {
    device_id: string;
    timestamp: string;
    event_type: 'sound_detected';
    event_data: {
        classification: {
            label: string;
            confidence: number;
            alternative_labels?: string[];
        };
        audio_metrics?: {
            duration_ms?: number;
            sample_rate?: number;
            rms_energy?: number;
            peak_amplitude?: number;
            clipping_detected?: boolean;
            snr_db?: number;
        };
    };
    message_type?: string;
    feature_vector_summary?: Record<string, unknown>;
    device_metadata?: Record<string, unknown>;
    processing_stats?: Record<string, unknown>;
    [key: string]: unknown;
}

async function handleDeviceErrorPayload(payload: DeviceErrorPayload, pool: Pool): Promise<void> {
    const q = `
                  INSERT INTO device_errors (device_id, ts, code, severity, description, count, first_occurence, raw_payload)
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
                  RETURNING id
                `;
    const params = [
        payload.device_id,
        new Date(payload.timestamp),
        payload.error.code,
        payload.error.severity,
        payload.error.description ?? null,
        payload.error.count ?? null,
        payload.error.first_occurrence ? new Date(payload.error.first_occurrence) : null,
        JSON.stringify(payload),
    ];

    try{
        const {rows} = await pool.query(q, params);
        return rows[0];

    }catch(error){
        console.error('Error inserting error payload on DB',error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Data base insert failed: ${errorMessage}`);
    }

}

async function handleAudioEventPayload(payload: AudioEventPayload, pool: Pool): Promise<void> {
    const { classification, audio_metrics = {} } = payload.event_data;

    const q = `
                  INSERT INTO audio_events (
                    device_id,
                    ts,
                    label,
                    confidence,
                    alt_labels,
                    duration_ms,
                    sample_rate,
                    rms_energy,
                    peak_amplitude,
                    clipping,
                    snr_db,
                    mfcc_summary,
                    device_meta,
                    proc_stats,
                    raw_payload
                  )
                  VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb)
                  RETURNING id
                `;

    const params = [
        payload.device_id,
        new Date(payload.timestamp),
        classification.label,
        classification.confidence,
        JSON.stringify(classification.alternative_labels ?? []),
        audio_metrics.duration_ms ?? null,
        audio_metrics.sample_rate ?? null,
        audio_metrics.rms_energy ?? null,
        audio_metrics.peak_amplitude ?? null,
        audio_metrics.clipping_detected ?? null,
        audio_metrics.snr_db ?? null,
        payload.feature_vector_summary ? JSON.stringify(payload.feature_vector_summary) : null,
        payload.device_metadata ? JSON.stringify(payload.device_metadata) : null,
        payload.processing_stats ? JSON.stringify(payload.processing_stats) : null,
        JSON.stringify(payload),
    ];

    try{
        const {rows} = await pool.query(q, params);
        return rows[0];
    }catch(error){
        console.error('Error inserting Audio Event payload on DB',error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Data base insert failed: ${errorMessage}`);
    }
}

export const ingestService = {
    handleDeviceErrorPayload,
    handleAudioEventPayload
}