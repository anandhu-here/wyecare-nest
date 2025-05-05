import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAbility } from '../lib/casl/AbilityContext';
import { Actions, Subjects } from '../lib/casl/ability';

interface PermissionRouteProps {
  action: Actions;
  subject: Subjects;
  subjectData?: any;
  redirectTo?: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  action,
  subject,
  subjectData,
  redirectTo = '/unauthorized',
}) => {
  const ability = useAbility();

  if (!ability.can(action, subject, subjectData)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
