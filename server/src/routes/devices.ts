import express, { Request, Response, NextFunction } from 'express';
import {Pool} from "pg";

const devicesRouter = express.Router();

export default function buildDevice(pool: Pool): express.Application {

    devicesRouter.get("/", (req: Request, res: Response, next:NextFunction) => {



    });

    return devicesRouter
}
