import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const eventsRouter = express.Router();

export default function buildEvents(pool: Pool): express.Router {
    // GET /api/events - Lista de eventos con paginación
    // Soporta: device_id, label, from, to, limit, offset
    eventsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deviceId = req.query.device_id as string | undefined;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;
            const label = req.query.label as string | undefined;
            const from = req.query.from as string | undefined;
            const to = req.query.to as string | undefined;

            let whereClause = '';
            const params: any[] = [];
            let paramIndex = 1;

            if (deviceId) {
                whereClause += ` WHERE device_id = $${paramIndex}`;
                params.push(deviceId);
                paramIndex++;
            }

            if (label) {
                whereClause += deviceId ? ` AND label = $${paramIndex}` : ` WHERE label = $${paramIndex}`;
                params.push(label);
                paramIndex++;
            }

            if (from) {
                whereClause += (deviceId || label) ? ` AND ts >= $${paramIndex}::timestamp` : ` WHERE ts >= $${paramIndex}::timestamp`;
                params.push(from);
                paramIndex++;
            }

            if (to) {
                whereClause += (deviceId || label || from) ? ` AND ts <= $${paramIndex}::timestamp` : ` WHERE ts <= $${paramIndex}::timestamp`;
                params.push(to);
                paramIndex++;
            }

            params.push(limit, offset);

            const q = `
                SELECT 
                    id,
                    device_id,
                    ts,
                    label,
                    confidence,
                    duration_ms,
                    created_at
                FROM audio_events
                ${whereClause || 'WHERE 1=1'}
                ORDER BY ts DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            // También obtener el total para paginación
            const countQ = `
                SELECT COUNT(*) as total
                FROM audio_events
                ${whereClause || 'WHERE 1=1'}
            `;

            const [eventsResult, countResult] = await Promise.all([
                pool.query(q, params),
                pool.query(countQ, params.slice(0, -2)) // Excluir limit y offset del count
            ]);

            return res.status(200).json({
                events: eventsResult.rows,
                total: parseInt(countResult.rows[0].total),
                limit,
                offset
            });
        } catch (err) {
            next(err);
        }
    });

    // GET /api/events/:id - Obtener un evento específico con su raw_payload
    eventsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const eventId = parseInt(req.params.id);

            if (isNaN(eventId)) {
                return res.status(400).json({ error: 'Invalid event ID' });
            }

            const q = `
                SELECT *
                FROM audio_events
                WHERE id = $1
            `;

            const { rows } = await pool.query(q, [eventId]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            return res.status(200).json(rows[0]);
        } catch (err) {
            next(err);
        }
    });

    return eventsRouter;
}

