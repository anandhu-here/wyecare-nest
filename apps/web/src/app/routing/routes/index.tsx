
// libs/web/features/src/lib/routing/routes/index.ts
import { RouteObject } from 'react-router-dom';
import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { publicRoutes } from './public.routes';

export const routes: RouteObject[] = [
    ...authRoutes,
    ...dashboardRoutes,
    ...publicRoutes
];

export * from './auth.routes';
export * from './dashboard.routes';
export * from './public.routes';