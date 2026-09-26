import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Accepts either a Zod object with body/query/params keys,
 * or an object of individual schemas.
 */
export function validate(schema: ZodTypeAny | ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if ('safeParse' in schema && typeof schema.safeParse === 'function') {
        const result = schema.safeParse({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (!result.success) {
          next(result.error);
          return;
        }

        const data = result.data as {
          body?: unknown;
          query?: unknown;
          params?: unknown;
        };

        if (data.body !== undefined) {
          req.body = data.body;
        }
        if (data.query !== undefined) {
          req.query = data.query as Request['query'];
        }
        if (data.params !== undefined) {
          req.params = data.params as Request['params'];
        }
      } else {
        const parts = schema as ValidationSchemas;
        if (parts.body) {
          req.body = parts.body.parse(req.body);
        }
        if (parts.query) {
          req.query = parts.query.parse(req.query) as Request['query'];
        }
        if (parts.params) {
          req.params = parts.params.parse(req.params) as Request['params'];
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
