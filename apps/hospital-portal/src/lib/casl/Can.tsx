import React from 'react';
import { useAbility } from './AbilityContext';
import { Actions, Subjects } from './ability';

interface CanProps {
  I: Actions;
  do: Subjects;
  this?: any;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component for declarative permission checks in JSX
 * Usage: <Can I="read" do="Patient" this={{ id: '123' }}> ... </Can>
 */
export const Can: React.FC<CanProps> = ({
  I: action,
  do: subject,
  this: subjectData,
  children,
  fallback = null
}) => {
  const ability = useAbility();

  return ability.can(action, subject, subjectData) ? <>{children}</> : <>{fallback}</>;
};