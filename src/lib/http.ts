import "server-only";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Wrap a route handler: maps HttpError / zod errors to JSON, hides everything else. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof z.ZodError) return Response.json({ error: "Invalid request" }, { status: 400 });
      console.error(e);
      return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  return schema.parse(await req.json().catch(() => null));
}
