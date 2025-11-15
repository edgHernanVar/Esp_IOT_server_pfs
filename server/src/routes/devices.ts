import express, { Request, Response, NextFunction } from 'express';
import {Pool} from "pg";

const devicesRouter = express.Router();

export default function buildDevice(pool: Pool): express.Router {

    devicesRouter.get("/", async (req: Request, res: Response, next:NextFunction) => {
        try{
            const q =`
                SELECT device_id, name, timezone, created_at FROM devices
            `;

            const {rows} = await pool.query(q);

            if(rows.length === 0){
                return res.status(404).send("No se encontro dispositivos");
            }
            return res.status(200).json(rows);
        }catch(err){
            next(err);
        }


    });

    return devicesRouter
}
