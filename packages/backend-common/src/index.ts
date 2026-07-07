if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production");
}
export const JWT_SECRET = process.env.JWT_SECRET || "123123";
