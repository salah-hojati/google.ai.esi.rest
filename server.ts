import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialization helper for Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Endpoint for Jersey Mentorship, Code Analysis, and Custom Challenge Generation
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { prompt, context, code, topic } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Graceful fallback response when API key is not configured
      return res.json({
        success: true,
        isFallback: true,
        answer: `### Jersey / JAX-RS Concept Overview: ${topic || "Java EE REST"}

**Jersey** is the reference implementation of **JAX-RS (Java API for RESTful Web Services)** (JSR 370 / Jakarta RESTful Web Services).

#### Key Highlights for your query:
1. **Annotations Lifecycle**: JAX-RS uses declarative annotations (\`@Path\`, \`@GET\`, \`@POST\`, \`@Produces\`, \`@Consumes\`) to bind HTTP semantics directly to POJOs.
2. **Filter & Interceptor Chain**: 
   - \`ContainerRequestFilter\` for Pre/Post-matching inspection and authentication
   - \`ReaderInterceptor\` for streaming deserialization transformation (e.g., decompression)
   - \`WriterInterceptor\` for outgoing payload manipulation
   - \`ContainerResponseFilter\` for decorating responses (CORS, cache headers)
3. **Client API**: Fluent \`ClientBuilder.newClient().target(uri).path(...).request().get()\` provides type-safe HTTP invocations.

*Tip: Connect your Gemini API Key in Settings > Secrets to unlock personalized interactive code reviews and customized Jersey exercises.*`
      });
    }

    const systemInstruction = `You are a world-class Java EE, Jakarta EE, and Jersey (JAX-RS) Enterprise Architect and Teacher.
You help Java developers master every aspect of Jersey:
- RESTful Resource endpoints, HTTP verb mapping, sub-resources, @PathParam, @QueryParam, @MatrixParam, @HeaderParam, @CookieParam, @BeanParam
- Filters (@PreMatching, ContainerRequestFilter, ContainerResponseFilter, @NameBinding, DynamicFeature, Priority)
- Interceptors (ReaderInterceptor, WriterInterceptor, GZIP, Decryption)
- Jersey Client API (WebTarget, Async Invocation, RxClient, ClientFilters, Connection pooling)
- Exception Mappers (ExceptionMapper<T>, WebApplicationException)
- Bean Validation (@Valid, ConstraintViolationException)
- Dependency Injection & Context (@Context UriInfo, HttpHeaders, SecurityContext, Request, HK2/CDI)
- Server-Sent Events (SSE), ChunkedOutput, AsyncResponse

Provide clear, modern (Jakarta EE 9+/10 & Java EE 8 compatible) Java code examples with precise explanations. Always highlight best practices and common pitfalls.`;

    const contents = `Context / User Code:\n\`\`\`java\n${code || "No code provided"}\n\`\`\`\n\nTopic: ${topic || "General Jersey"}\n\nUser Question:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({
      success: true,
      answer: response.text,
      isFallback: false,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI response",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "Jersey REST Practice Studio" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jersey Practice Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
