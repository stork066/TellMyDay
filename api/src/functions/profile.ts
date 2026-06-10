import { app, type HttpRequest, type HttpResponseInit } from "@azure/functions";
import { HttpError } from "../shared/story.js";
import { checkPin, getProfile, saveSection, validateSectionInput } from "../shared/profile.js";

app.http("profile", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      checkPin(req.headers.get("x-caretaker-pin") ?? undefined);
      if (req.method === "GET") {
        return { status: 200, jsonBody: { sections: await getProfile() } };
      }
      const body = await req.json().catch(() => ({}));
      const { section, content } = validateSectionInput(body);
      await saveSection(section, content);
      return { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      if (err instanceof HttpError) {
        return { status: err.status, jsonBody: { error: err.message } };
      }
      console.error(err);
      return { status: 500, jsonBody: { error: "Something went wrong. Please try again." } };
    }
  },
});
