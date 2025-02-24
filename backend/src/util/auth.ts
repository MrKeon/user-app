import { Context } from "https://deno.land/x/oak/mod.ts";
import { JWTPayload, jwtVerify, SignJWT } from "npm:jose@5.9.6";
import { GOOGLE_CLIENT_ID } from "../routes.ts";

const JWT_SECRET_STRING = Deno.env.get("JWT_SECRET") || "your-secret-key";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// Create JWT
export const createJWT = async (payload: JWTPayload) => {
    return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256"})
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET)
}

type JwtType = "homemade" | "google"
// Verify JWT
export const verifyJWT = async (token: string, jwtType: JwtType = "homemade") => {
    try {
        if (jwtType === "homemade") {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            console.log("JWT is valid: ", payload);
            return payload;
        } else if (jwtType === "google") {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(GOOGLE_CLIENT_ID), { algorithms: ["RS256"]})
            console.log("Google JWT is valid: ", payload);
            return payload;
        } else {
            throw new Error("Unrecognized jwt type.")
        }
    } catch (error) {
        console.error("Invalid JWT: ", error);
        return null;
    }
}

export const authMiddleware = async (ctx: Context, next: Function) => {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Unauthorized" };
        return;
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyJWT(token);

    if (!payload) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Invalid token" };
        return;
    }

    ctx.state.user = payload; // Store user info in state
    await next();
}