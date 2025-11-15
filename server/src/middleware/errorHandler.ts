import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

export interface HttpErrorOptions {
    expose?: boolean;
    details?: unknown;
}

export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly expose: boolean;
    public readonly details?: unknown;

    constructor(statusCode: number, message: string, options: HttpErrorOptions = {}) {
        super(message);
        this.name = "HttpError";
        this.statusCode = statusCode;
        this.expose = options.expose ?? statusCode < 500;
        this.details = options.details;
    }
}

function resolveStatusCode(error: unknown): number {
    if (error instanceof HttpError) {
        return error.statusCode;
    }

    if (typeof error === "object" && error !== null) {
        const maybeStatus = (error as { status?: number }).status;
        if (typeof maybeStatus === "number") {
            return maybeStatus;
        }

        const maybeStatusCode = (error as { statusCode?: number }).statusCode;
        if (typeof maybeStatusCode === "number") {
            return maybeStatusCode;
        }
    }

    return 500;
}

function shouldExposeMessage(error: unknown, statusCode: number): boolean {
    if (error instanceof HttpError) {
        return error.expose;
    }

    return statusCode < 500;
}

const errorHandler: ErrorRequestHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const statusCode = resolveStatusCode(error);
    const exposeMessage = shouldExposeMessage(error, statusCode);
    const responseBody: {
        error: string;
        details?: unknown;
    } = {
        error:
            exposeMessage && error instanceof Error
                ? error.message
                : "Internal server error",
    };

    if (error instanceof HttpError && error.details !== undefined && exposeMessage) {
        responseBody.details = error.details;
    }

    if (!exposeMessage && process.env.NODE_ENV !== "production" && error instanceof Error) {
        responseBody.details = {
            message: error.message,
            stack: error.stack,
        };
    }

    const logPayload = {
        method: req.method,
        path: req.originalUrl,
        statusCode,
    };

    console.error("Unhandled error", logPayload, error);

    res.status(statusCode).json(responseBody);
};

export default errorHandler;
