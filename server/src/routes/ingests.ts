import express, { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Pool } from 'pg';
import Ajv, { JSONSchemaType } from 'ajv';

import buildDeviceAuthMiddleware from "../middleware/authDevice";

const ingestsRouter = express.Router();

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

type IngestPayload = DeviceErrorPayload | AudioEventPayload;

// ajv creation
const ajv = new Ajv({ allErrors: true, strict: false });

// schemas of data and error
const eventSchema = require('../validators/event.schema.json') as JSONSchemaType<AudioEventPayload>;
const errorSchema = require('../validators/error.schema.json') as JSONSchemaType<DeviceErrorPayload>;

const validateEvent = ajv.compile<AudioEventPayload>(eventSchema);
const validateError = ajv.compile<DeviceErrorPayload>(errorSchema);

type IngestRequest = Request<ParamsDictionary, unknown, IngestPayload>;

export default function buildIngests(pool: Pool) {
    ingestsRouter.use(buildDeviceAuthMiddleware(pool));

    ingestsRouter.post('/', async (req: IngestRequest, res: Response, next: NextFunction) => {
        try{
            const authenticatedDevice = req.authenticatedDevice;
            if (!authenticatedDevice) {
                return res.status(500).json({error: 'Device authentication context missing'});
            }
            const body = req.body;
            if(body.device_id !== authenticatedDevice.deviceId) {
                return res.status(403).json({error: 'Authenticated Device id mismatch'});
            }

            if(validateError(body)) {
                const q = `
                  INSERT INTO device_errors (device_id, ts, code, severity, description, count, first_occurence, raw_payload)
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
                  RETURNING id
                `;
                const params = [
                    body.device_id,
                    new Date(body.timestamp),
                    body.error.code,
                    body.error.severity,
                    body.error.description ?? null,
                    body.error.count ?? null,
                    body.error.first_occurrence ? new Date(body.error.first_occurrence) : null,
                    JSON.stringify(body),
                ];

                const insertResult = await pool.query(q, params);
                return res.status(201).json({ status: 'ok',type:'error',id: insertResult.rows[0].id });
            }

            if(validateEvent(body)) {
                const { classification, audio_metrics = {} } = body.event_data;

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
                    body.device_id,
                    new Date(body.timestamp),
                    classification.label,
                    classification.confidence,
                    JSON.stringify(classification.alternative_labels ?? []),
                    audio_metrics.duration_ms ?? null,
                    audio_metrics.sample_rate ?? null,
                    audio_metrics.rms_energy ?? null,
                    audio_metrics.peak_amplitude ?? null,
                    audio_metrics.clipping_detected ?? null,
                    audio_metrics.snr_db ?? null,
                    body.feature_vector_summary ? JSON.stringify(body.feature_vector_summary) : null,
                    body.device_metadata ? JSON.stringify(body.device_metadata) : null,
                    body.processing_stats ? JSON.stringify(body.processing_stats) : null,
                    JSON.stringify(body),
                ];

                const insertResult = await pool.query(q, params);
                return res.status(201).json({ id: insertResult.rows[0].id });
            }

            return res.status(400).json({ error: 'Unsupported payload', details: ajv.errorsText(validateError.errors || validateEvent.errors || []) });

        }catch(err){
            console.error(err);//medida prevetiva lol

            next(err);
        }

    });
    return ingestsRouter;
}


