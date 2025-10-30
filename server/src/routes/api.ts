import express, { Request, Response, NextFunction } from 'express';
import ingestsRouter from './ingests'
const apiRouter = express.Router();


apiRouter.get('/', (request: Request, res: Response): void => {
    res.status(200).send('OK');
});

apiRouter.use('/ingests', ingestsRouter);


export default apiRouter;