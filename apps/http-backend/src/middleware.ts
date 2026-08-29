import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// `req.userId` is set by the auth middleware below. Declaring it on Express'
// own Request keeps every handler typed instead of reaching for @ts-ignore.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers["authorization"] ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    // jwt.verify throws on a missing, malformed or expired token, which
    // without this would surface as a 500 instead of a 403
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string" || !decoded.userId) {
            res.status(403).json({
                message: "Unauthorized"
            })
            return;
        }

        req.userId = String(decoded.userId);
        next();
    }
    catch (e) {
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}

/**
 * A small fixed-window limiter for the unauthenticated endpoints. Sign in and
 * sign up are the only paths an attacker can hit without a token, so leaving
 * them uncapped invites credential stuffing.
 */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
    const hits = new Map<string, { count: number; resetAt: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = req.ip ?? "unknown";
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
        } else if (entry.count >= max) {
            res.status(429).json({
                message: "Too many attempts. Try again in a minute."
            });
            return;
        } else {
            entry.count += 1;
        }

        // drop expired keys so a long-running process doesn't grow unbounded
        if (hits.size > 5000) {
            for (const [k, v] of hits) {
                if (v.resetAt <= now) hits.delete(k);
            }
        }

        next();
    };
}
