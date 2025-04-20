import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	private logger = new Logger('HTTP');

	use(req: Request, res: Response, next: NextFunction): void {
		const { method, originalUrl, body } = req;
		const startAt = process.hrtime();

		res.on('finish', () => {
			const { statusCode } = res;
			const diff = process.hrtime(startAt);
			const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
			this.logger.log(
				`{${originalUrl}, ${method}} \n statusCode: ${statusCode} \n responseTime: ${responseTime}ms, ${
					responseTime / 1000
				}s`,
			);
			this.logger.debug(`\nBody: ${JSON.stringify(body, null, 2)}`);
		});

		next();
	}
}
