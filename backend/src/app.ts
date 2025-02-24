import { Application } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { getRouter } from "./routes.ts";

const PORT = Deno.env.get("PORT") || "8000";
export const ENV = Deno.env.get("NODE_ENV") || "development";

export const app = new Application();
const router = await getRouter();
if (ENV == "development") {
    app.use(oakCors());
}
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://0.0.0.0:${PORT}`);
await app.listen({ port: parseInt(PORT) });
