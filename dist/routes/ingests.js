"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildIngests;
const express_1 = __importDefault(require("express"));
const ajv_1 = __importDefault(require("ajv"));
const authDevice_1 = __importDefault(require("../middleware/authDevice"));
const ingestsRouter = express_1.default.Router();
// ajv creation
const ajv = new ajv_1.default({ allErrors: true, strict: false });
// schemas of data and error
const eventSchema = require('../validators/event.schema.json');
const errorSchema = require('../validators/error.schema.json');
const validateEvent = ajv.compile(eventSchema);
const validateError = ajv.compile(errorSchema);
function buildIngests(pool) {
    ingestsRouter.use((0, authDevice_1.default)(pool));
    ingestsRouter.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            const authenticatedDevice = req.authenticatedDevice;
            if (!authenticatedDevice) {
                return res.status(500).json({ error: 'Device authentication context missing' });
            }
            const body = req.body;
            if (body.device_id !== authenticatedDevice.deviceId) {
                return res.status(403).json({ error: 'Authenticated Device id mismatch' });
            }
            if (validateError(body)) {
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
                    (_a = body.error.description) !== null && _a !== void 0 ? _a : null,
                    (_b = body.error.count) !== null && _b !== void 0 ? _b : null,
                    body.error.first_occurrence ? new Date(body.error.first_occurrence) : null,
                    JSON.stringify(body),
                ];
                const insertResult = yield pool.query(q, params);
                return res.status(201).json({ status: 'ok', type: 'error', id: insertResult.rows[0].id });
            }
            if (validateEvent(body)) {
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
                    JSON.stringify((_c = classification.alternative_labels) !== null && _c !== void 0 ? _c : []),
                    (_d = audio_metrics.duration_ms) !== null && _d !== void 0 ? _d : null,
                    (_e = audio_metrics.sample_rate) !== null && _e !== void 0 ? _e : null,
                    (_f = audio_metrics.rms_energy) !== null && _f !== void 0 ? _f : null,
                    (_g = audio_metrics.peak_amplitude) !== null && _g !== void 0 ? _g : null,
                    (_h = audio_metrics.clipping_detected) !== null && _h !== void 0 ? _h : null,
                    (_j = audio_metrics.snr_db) !== null && _j !== void 0 ? _j : null,
                    body.feature_vector_summary ? JSON.stringify(body.feature_vector_summary) : null,
                    body.device_metadata ? JSON.stringify(body.device_metadata) : null,
                    body.processing_stats ? JSON.stringify(body.processing_stats) : null,
                    JSON.stringify(body),
                ];
                const insertResult = yield pool.query(q, params);
                return res.status(201).json({ id: insertResult.rows[0].id });
            }
            return res.status(400).json({ error: 'Unsupported payload', details: ajv.errorsText(validateError.errors || validateEvent.errors || []) });
        }
        catch (err) {
            next(err);
        }
    }));
    return ingestsRouter;
}
