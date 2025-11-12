import express, { Request, Response, NextFunction } from 'express';
import buildIngests from './ingests'
import buildDevice from "./devices";
import buildErrors from "./errors";
const apiRouter = express.Router();
import {Pool} from 'pg';

export default function buildApi(pool: Pool) {

    apiRouter.use('/ingests',buildIngests(pool));
    apiRouter.use('/devices',buildDevice(pool));
    apiRouter.use('/errors', buildErrors(pool));

    return apiRouter;
}

apiRouter.get('/', (request: Request, res: Response): void => {
    res.status(200).send('OK');
});
