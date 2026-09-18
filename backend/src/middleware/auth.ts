import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que valida o secret interno enviado pelo frontend.
 * O frontend inclui o header: x-internal-secret: <INTERNAL_SECRET>
 * 
 * Isso evita que qualquer pessoa externa chame o backend livremente.
 * Para chamadas do webhook da Evolution usamos uma rota separada (sem este middleware).
 */
export function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret'];

  if (!process.env.INTERNAL_SECRET) {
    // Se não configurado, deixa passar (desenvolvimento)
    console.warn('[Auth] INTERNAL_SECRET not set — skipping auth check');
    next();
    return;
  }

  if (secret !== process.env.INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
