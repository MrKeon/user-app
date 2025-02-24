import { Router, Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { compare, hash } from "https://deno.land/x/bcrypt/mod.ts";
import { authMiddleware, createJWT } from "./util/auth.ts";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_CLIENT_SECRET, ENV } from "./config.ts";
import { connectToDatabase } from "./component/database/init.ts";

interface Account {
    id: string;
    name: string;
    email: string;
}

interface User extends Account {
  password: string;
}
  
export const getRouter = async () => {
    const client = await connectToDatabase();
    const router = new Router();
    
    /**
     * User Login
     */
    router.post("/login", async (ctx) => {
        if (!ctx.request.hasBody || !(await ctx.request.body.json())?.email || !(await ctx.request.body.json())?.password) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Email and password required" };
          return;
        }
      
        const body = await ctx.request.body.json();
        const { email, password } = body;
      
        try {
          const result = await client.query("SELECT id, name, email, password FROM users WHERE email = $1", [email]);
          if (result.length === 0) {
            ctx.response.status = 401;
            ctx.response.body = { error: "Invalid email" };
            return;
          }
      
          const {id, name, email: emailDB, password: hashedPassword} = result[0] as User;
      
          if (!(await compare(password, hashedPassword as string))) {
            console.log(result)
            ctx.response.status = 401;
            ctx.response.body = { error: "Invalid password" };
            return;
          }
      
          const token = await createJWT({ id, name, email });
      
          ctx.response.status = 200;
          ctx.response.body = { token };
        } catch (err: any) {
          ctx.response.status = 500;
          ctx.response.body = { error: err.message };
        }
      });      

      // Redirect user to Google's OAuth consent page
      router.get("/auth/google", (ctx) => {
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/auth");
        googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        googleAuthUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
        googleAuthUrl.searchParams.set("response_type", "code");
        googleAuthUrl.searchParams.set("scope", "openid email profile");

        ctx.response.redirect(googleAuthUrl.toString());
      });

      router.get("/auth/google/callback", async (ctx) => {
        const url = new URL(ctx.request.url);
        const code = url.searchParams.get("code");

        if (!code) {
          ctx.response.status = 400;
          ctx.response.body = { error: 'No authorization code provided' };
          return;
        }

        // exchange code for Google access token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
            code,
          }),
        }).then((res) => res.json());

        if (!tokenResponse.id_token) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Failed to get Google ID token" };
          return;
        }

        // Decode Google ID token
        const googleUser = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenResponse.id_token}`
        ).then((res) => res.json());

        // TODO: REMOVE
        console.log(googleUser);
        const { sub: googleId, email, name } = googleUser;

        // Check if user exists
        const existingUser: Account = (await client.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        )as Account[])[0];

        let userId: string;
        if (!existingUser) {
          // Create a new user
          const newUser: Account = await client.insert('users', { name, email, googleId });
          userId = newUser.id;
        } else {
          userId = existingUser.id
        }
        // Generate JWT for the user
        const token = await createJWT({userId, email});
        ctx.response.headers.set("Authorization", `Bearer ${token}`);
      })
            
    /**
     * Create a User
     */
    router.post("/register", async (ctx: Context) => {
        if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Request body is required" };
        return;
        }
    
        const body = await ctx.request.body.json();
        const { name, email, password } = body;
    
        if (!name || !email || !password) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Name, email, and password are required" };
        return;
        }
    
        const hashedPassword = await hash(password);
    
        try {
          const account: Account = (await client.insert('users', {name, email, password: hashedPassword as string})) as Account[][0];
          const token = await createJWT({ id: account.id, name, email });
          ctx.response.status = 201;
          ctx.response.body = { message: "User registered successfully" };
          ctx.response.headers.set("Authorization", `Bearer ${token}`)
        } catch (err: any) {
          ctx.response.status = 500;
          ctx.response.body = { error: err.message };
        }
    });
    
    /**
     * Get All Users
     */
    router.get("/users", authMiddleware, async (ctx: Context) => {
        try {
            const result = await client.query(`SELECT id, name, email FROM users`);
        ctx.response.body = { users: result };
        } catch (err: any) {
        ctx.response.status = 500;
        ctx.response.body = { error: err.message };
        }
    });
    
    /**
     * Get a Single User by ID
     */
    router.get("/users/:id", authMiddleware, async (ctx: RouterContext<"/users/:id">) => {
        const id = ctx.params.id;
    
        try {
        const result = await client.query(`SELECT id, name, email FROM users WHERE id = ${id}`);
        
        if (result.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { error: "User not found" };
            return;
        }
    
        ctx.response.body = { user: result[0] };
        } catch (err: any) {
        ctx.response.status = 500;
        ctx.response.body = { error: err.message };
        }
    });
    
    /**
     * Update a User by ID
     */
    router.put("/users/:id", authMiddleware, async (ctx: RouterContext<"/users/:id">) => {
        const id = ctx.params.id;
    
        if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Request body is required" };
        return;
        }
    
        const body = await ctx.request.body.json();
        const { name, email, password } = body;
    
        try {
        const userExists = await client.query(`SELECT * FROM users WHERE id = ${id}`);
        if (userExists.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { error: "User not found" };
            return;
        }
    
        const hashedPassword = password ? await hash(password) : undefined;
    
        await client.query(`UPDATE users SET name = COALESCE(${name}, name), email = COALESCE(${email}, email), password = COALESCE(${hashedPassword}, password) WHERE id = ${id}`);
        ctx.response.body = { message: "User updated successfully" };
        } catch (err: any) {
        ctx.response.status = 500;
        ctx.response.body = { error: err.message };
        }
    });
    
    /**
     * Delete a User by ID
     */
    router.delete("/users/:id", authMiddleware, async (ctx: RouterContext<"/users/:id">) => {
        const id = ctx.params.id;
    
        try {
        const userExists = await client.query(`SELECT * FROM users WHERE id = ${id}`);
        if (userExists.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { error: "User not found" };
            return;
        }
    
        await client.query(`DELETE FROM users WHERE id = ${id}`);
        ctx.response.body = { message: "User deleted successfully" };
        } catch (err: any) {
        ctx.response.status = 500;
        ctx.response.body = { error: err.message };
        }
    });
    router.get("/page1", authMiddleware, ctx => {
      ctx.response.status = 200;
      ctx.response.body = { message: "Page1" };
    })
    router.get("/page2", authMiddleware, ctx => {
      ctx.response.status = 200;
      ctx.response.body = { message: "Page2" };
    })
    return router;
}