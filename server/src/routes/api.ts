import express, { Request, Response, NextFunction } from 'express';
import buildIngests from './ingests'
import buildDevice from "./devices";
import buildErrors from "./errors";
import buildStats from "./stats";
import buildEvents from "./events";
import {Pool} from 'pg';

export default function buildApi(pool: Pool) {
    const apiRouter = express.Router();

    apiRouter.get('/', (request: Request, res: Response): void => {
        res.status(200).send('OK');
    });

    apiRouter.use('/ingests',buildIngests(pool));
    apiRouter.use('/devices',buildDevice(pool));
    apiRouter.use('/errors', buildErrors(pool));
    apiRouter.use('/stats', buildStats(pool));
    apiRouter.use('/events', buildEvents(pool));

    return apiRouter;
}
