import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { Pool } from "pg";

export interface AuthenticatedDevice {
    deviceId: string;
    name: string;
    timezone: string;
}

export type DeviceAuthRequest = Request & {
    authenticatedDevice?: AuthenticatedDevice;
};

declare module "express-serve-static-core" {
    interface Request {
        authenticatedDevice?: AuthenticatedDevice;
    }
}

function hashDeviceKey(deviceKey: string): string {
    return crypto.createHash("sha256").update(deviceKey).digest("hex");
}

interface DeviceRow {
    device_id: string;
    api_key_hash: string;
    name: string;
    timezone: string;
}

async function fetchDeviceById(pool: Pool, deviceId: string): Promise<DeviceRow | null> {
    const { rows } = await pool.query(
        "SELECT device_id, api_key_hash, name, timezone FROM devices WHERE device_id = $1",
        [deviceId],
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as DeviceRow;
}

export default function buildDeviceAuthMiddleware(pool: Pool) {
    return async function authDevice(
        req: DeviceAuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const deviceId = req.header("X-Device-Id");
            const deviceKey = req.header("X-Device-Key");

            if (!deviceId || !deviceKey) {
                res.status(401).json({ error: "Missing device authentication headers" });
                return;
            }

            const device = await fetchDeviceById(pool, deviceId);

            if (!device) {
                res.status(401).json({ error: "Unknown device" });
                return;
            }

            if (hashDeviceKey(deviceKey) !== device.api_key_hash) {
                res.status(401).json({ error: "Invalid device key" });
                return;
            }

            req.authenticatedDevice = {
                deviceId: device.device_id,
                name: device.name,
                timezone: device.timezone,
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}
