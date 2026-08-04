import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware(req:Request,res:Response, next: NextFunction){
    const header = req.headers["authorization"] ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    // jwt.verify throws on a missing, malformed or expired token, which
    // without this would surface as a 500 instead of a 403
    try{
        const decoded = jwt.verify(token,JWT_SECRET);

        if(typeof decoded === "string" || !decoded.userId){
            res.status(403).json({
                message:"Unauthorized"
            })
            return;
        }

        //@ts-ignore
        req.userId = decoded.userId;
        next();
    }
    catch(e){
        res.status(403).json({
            message:"Unauthorized"
        })
    }
}
