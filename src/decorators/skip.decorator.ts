import { SetMetadata } from '@nestjs/common';

export const NoGlobalInterceptor = () => SetMetadata('skip-global-interceptor', true);
