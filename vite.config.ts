import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { config as loadDotenv } from "dotenv";
import type { IncomingMessage, ServerResponse } from "node:http";
import { generateStory, HttpError } from "./api/src/shared/story.js";
import { checkPin, getProfile, saveSection, validateSectionInput } from "./api/src/shared/profile.js";

// Serves the api/ endpoints during `npm run dev`, mirroring the Azure
// Functions. The config is bundled once at startup, so restart the dev
// server after editing files in api/src/shared/.
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });
}

function jsonRoute(
  handler: (req: IncomingMessage, body: string) => Promise<{ status?: number; payload: unknown }>,
) {
  return (req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      res.setHeader("Content-Type", "application/json");
      try {
        const body = await readBody(req);
        const { status = 200, payload } = await handler(req, body);
        res.statusCode = status;
        res.end(JSON.stringify(payload));
      } catch (err) {
        const known = err instanceof HttpError;
        if (!known) console.error(err);
        res.statusCode = known ? err.status : 500;
        res.end(
          JSON.stringify({
            error: known ? err.message : "Something went wrong. Please try again.",
          }),
        );
      }
    })();
  };
}

function apiDev(): Plugin {
  return {
    name: "tell-my-day-api-dev",
    configureServer(server) {
      loadDotenv({ path: ".env.local" });

      server.middlewares.use(
        "/api/generate",
        jsonRoute(async (req, body) => {
          if (req.method !== "POST") return { status: 405, payload: { error: "Method not allowed" } };
          return { payload: await generateStory(body ? JSON.parse(body) : {}) };
        }),
      );

      server.middlewares.use(
        "/api/profile",
        jsonRoute(async (req, body) => {
          checkPin(req.headers["x-caretaker-pin"]);
          if (req.method === "GET") {
            return { payload: { sections: await getProfile() } };
          }
          if (req.method === "PUT") {
            const { section, content } = validateSectionInput(body ? JSON.parse(body) : {});
            await saveSection(section, content);
            return { payload: { ok: true } };
          }
          return { status: 405, payload: { error: "Method not allowed" } };
        }),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDev()],
  server: {
    // 5173 is taken by another local project; use a fixed uncommon port.
    port: 5183,
    strictPort: true,
  },
});
