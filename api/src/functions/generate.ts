import { app, type HttpRequest, type HttpResponseInit } from "@azure/functions";
import { generateStory, HttpError } from "../shared/story.js";

app.http("generate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await req.json().catch(() => ({}));
      return { status: 200, jsonBody: await generateStory(body) };
    } catch (err) {
      if (err instanceof HttpError) {
        return { status: err.status, jsonBody: { error: err.message } };
      }
      console.error(err);
      return {
        status: 500,
        jsonBody: { error: "Something went wrong writing the story. Please try again." },
      };
    }
  },
});
