import express, { Request, Response, NextFunction } from 'express';
import {Pool} from "pg";

const errorsRouter = express.Router();

export default function buildErrors(pool: Pool):express.Router {

    errorsRouter.get('/', async (req: Request, res: Response, next) => {

        try{
            //this has to be the id
            const selectedDevice = req.query.selectedDevice;

            //ensuring there is a selectedDevice
            if (!selectedDevice) {
                return res.status(400).json({ error: 'Missing required query parameter: selectedDevice' });
            }

            const q = `
            SELECT * FROM device_errors WHERE device_id = $1 ORDER BY id DESC LIMIT 6`;

            //pass selectedDevice as parameter
            const { rows } = await pool.query(q,[selectedDevice]);

            if(rows.length === 0) {
                return res.status(404).send("No se encontro dispositivos");
            }
            res.status(200).json(rows);

        }catch(err){
            next(err);
        }

    });

    return errorsRouter;
}
