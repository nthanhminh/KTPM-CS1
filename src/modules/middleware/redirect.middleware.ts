import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class RedirectMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: any) {
		if (req.originalUrl === '/') {
			return res.redirect('/api');
		}
		next();
	}
}
