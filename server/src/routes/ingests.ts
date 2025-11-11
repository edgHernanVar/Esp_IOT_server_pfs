import express, { Request, Response, NextFunction } from 'express';
const ingestsRouter = express.Router();
import {Pool} from 'pg';
import Ajv, {JSONSchemaType} from "ajv";
import crypto  from "node:crypto";

//ajv creation
const ajv = new Ajv({allErrors: true, strict: false});

//schemas of data and error
const eventSchema = require("../validators/event.schema.json");
const errorSchema = require("../validators/event.schema.json");

const validateEvent = ajv.compile(eventSchema);
const validateError = ajv.compile(errorSchema);

export default function buildIngests(pool: Pool) {
    ingestsRouter.post("/ingests", async (req, res, next) => {
        try{
            const deviceId = req.header('X-Device-Id') || '';
            const deviceKey = req.header('X-Device-Key') || '';

            if(!deviceKey || !deviceId) {
                return res.status(401).json({error: 'Missing headers'});
            }

            const { rows} = await pool.query(
                'SELECT api_key_hash FROM devices WHERE device_id = $1',
                [deviceId],
            );

            if(rows.length === 0)
            {
                return res.status(401).json({error: 'unknown device'});
            }

            //we get the actual key of the device
            const hash = crypto.createHash('sha256').update(deviceKey).digest('hex');
            if (hash !== rows[0].api_key_hash) {
                return res.status(401).json({error: 'Invalid key'});
            }

            const body:any = req.body;

            if(body?.message_type === 'error'){
                if(!validateError(body)) {
                    return res.status(400).json({error: 'Invalid error payload',details: validateError.errors});
                }

                const q = `
                  INSERT INTO device_errors (device_id, ts, code, severity, description, count, first_occurence, raw_payload)
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
                  RETURNING id
                `;
                const params:any[] = [
                    body.device_id,
                ];
            }





        }catch(err){

        }

    });
    return ingestsRouter;
}


