import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const statsRouter = express.Router();

export default function buildStats(pool: Pool): express.Router {
    // GET /api/stats/daily - Eventos por día
    // Soporta: days (últimos N días) o from/to (rango de fechas)
    statsRouter.get('/daily', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deviceId = req.query.device_id as string | undefined;
            const from = req.query.from as string | undefined;
            const to = req.query.to as string | undefined;
            const daysParam = req.query.days ? parseInt(req.query.days as string) : undefined;
            
            let q: string;
            let params: any[];
            let whereDateClause = '';

            // Construir cláusula de fecha
            if (from && to) {
                // Usar rango from/to
                whereDateClause = `AND day_utc >= $${deviceId ? 2 : 1}::date AND day_utc <= $${deviceId ? 3 : 2}::date`;
                if (deviceId) {
                    params = [deviceId, from, to];
                } else {
                    params = [from, to];
                }
            } else if (daysParam) {
                // Usar días
                const days = Math.max(1, Math.min(365, daysParam));
                whereDateClause = `AND day_utc >= CURRENT_DATE - INTERVAL '${days} days'`;
                if (deviceId) {
                    params = [deviceId];
                } else {
                    params = [];
                }
            } else {
                // Por defecto: últimos 7 días
                whereDateClause = `AND day_utc >= CURRENT_DATE - INTERVAL '7 days'`;
                if (deviceId) {
                    params = [deviceId];
                } else {
                    params = [];
                }
            }

            if (deviceId) {
                q = `
                    SELECT 
                        day_utc,
                        SUM(events) as total_events
                    FROM v_daily_label_counts
                    WHERE device_id = $1 
                        ${whereDateClause}
                    GROUP BY day_utc
                    ORDER BY day_utc ASC
                `;
            } else {
                q = `
                    SELECT 
                        day_utc,
                        SUM(events) as total_events
                    FROM v_daily_label_counts
                    WHERE 1=1
                        ${whereDateClause}
                    GROUP BY day_utc
                    ORDER BY day_utc ASC
                `;
            }

            const { rows } = await pool.query(q, params);
            return res.status(200).json(rows);
        } catch (err) {
            next(err);
        }
    });

    // GET /api/stats/top-labels - Top 5 etiquetas de los últimos 7 días
    statsRouter.get('/top-labels', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deviceId = req.query.device_id as string | undefined;
            const daysParam = parseInt(req.query.days as string) || 7;
            const limitParam = parseInt(req.query.limit as string) || 5;
            // Validar que los valores estén en rangos razonables
            const days = Math.max(1, Math.min(365, daysParam));
            const limit = Math.max(1, Math.min(50, limitParam));

            let q: string;
            let params: any[];

            if (deviceId) {
                q = `
                    SELECT 
                        label,
                        SUM(events) as total_events
                    FROM v_daily_label_counts
                    WHERE device_id = $1 
                        AND day_utc >= CURRENT_DATE - INTERVAL '${days} days'
                    GROUP BY label
                    ORDER BY total_events DESC
                    LIMIT $2
                `;
                params = [deviceId, limit];
            } else {
                q = `
                    SELECT 
                        label,
                        SUM(events) as total_events
                    FROM v_daily_label_counts
                    WHERE day_utc >= CURRENT_DATE - INTERVAL '${days} days'
                    GROUP BY label
                    ORDER BY total_events DESC
                    LIMIT $1
                `;
                params = [limit];
            }

            const { rows } = await pool.query(q, params);
            return res.status(200).json(rows);
        } catch (err) {
            next(err);
        }
    });

    return statsRouter;
}

