import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { superoak } from "https://deno.land/x/superoak/mod.ts";
import { app }from "../src/app.ts"; // Import your Oak app
import { createJWT } from "../src/util/auth.ts";

Deno.test("POST /register should return the user token", async () => {
    const request = await superoak(app);
    const payload = {
        name: "test",
        email: "test@email.com",
        password: "testpassword"
    };

    const expectedToken = await createJWT(payload)
    await request.post("/register")
    .send(payload)
    .expect(201)
    .expect((res) => {
        assertEquals(res.headers["Authorization"], `Bearer ${expectedToken}`)
    })
})