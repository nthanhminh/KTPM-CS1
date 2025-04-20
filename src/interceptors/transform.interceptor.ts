import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from './interfaces';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TransformInterceptor implements NestInterceptor {

	constructor(private reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<any>,
	): Observable<any> | Promise<Observable<any>> {
		const skipInterceptor = this.reflector.get<boolean>('skip-global-interceptor', context.getHandler());
		console.log("Hello ---- ", skipInterceptor)
		if (skipInterceptor) {
			return next.handle();
		}
		return next.handle().pipe(
			map(({ data, message }: IResponse) => {
				return {
					statusCode: context.switchToHttp().getResponse().statusCode,
					data,
					message,
				};
			}),
		);
	}
}
