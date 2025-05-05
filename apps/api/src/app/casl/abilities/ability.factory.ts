// apps/api/src/app/casl/abilities/ability.factory.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Action } from '../enums/actions.enums';
import {
  Organization,
  Department,
  Patient,
  MedicalRecord,
  Appointment,
  ShiftType,
  StaffProfile,
  ShiftSchedule,
  ShiftAttendance,
  PayPeriod,
  StaffPayment,
  InvitationClass,
  Permission,
  Role,
  User,
} from '../entities';

// Define all possible subject types
export type Subjects = InferSubjects<
  | typeof Organization
  | typeof User
  | typeof Department
  | typeof Role
  | typeof Permission
  | typeof Patient
  | typeof MedicalRecord
  | typeof Appointment
  | typeof ShiftType
  | typeof StaffProfile
  | typeof ShiftSchedule
  | typeof ShiftAttendance
  | typeof PayPeriod
  | typeof StaffPayment
  | typeof InvitationClass
  | 'all'
>;

export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  private readonly logger = new Logger(AbilityFactory.name);

  constructor(private prismaService: PrismaService) {}

  /**
   * Creates a CASL ability instance for the specified user
   */
  async createForUser(
    userId: string,
    userContext?: Record<string, any>
  ): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility
    );

    try {
      // Get user with roles and permissions
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          departments: {
            include: {
              department: true,
            },
          },
          staffProfile: true,
        },
      });

      if (!user) {
        // Basic ability for unauthenticated users - restricted to public content
        this.logger.warn(`Creating abilities for non-existent user: ${userId}`);
        can(Action.READ, 'all', { isPublic: true });
        return build({
          detectSubjectType: this.detectSubjectType as any,
        });
      }

      // Store user context for condition evaluation
      const context = {
        user: {
          id: user.id,
          organizationId: user.organizationId,
          departmentIds: user.departments.map((ud) => ud.departmentId),
          headOfDepartmentIds: user.departments
            .filter((ud) => ud.isHead)
            .map((ud) => ud.departmentId),
          staffProfileId: user.staffProfile?.id,
        },
        ...userContext,
      };

      // Process role permissions
      for (const userRole of user.roles) {
        const { role } = userRole;

        for (const rolePermission of role.permissions) {
          const { permission, conditions } = rolePermission;

          // Map string subject to class
          const subjectClass = this.mapSubjectToClass(permission.subject);

          // Apply the permission with its conditions
          if (conditions) {
            const evaluatedConditions = this.evaluateConditions(
              conditions as Record<string, any>,
              context
            );
            can(permission.action as Action, subjectClass, evaluatedConditions);
          } else {
            can(permission.action as Action, subjectClass);
          }
        }
      }

      // Check if user has super admin role
      const isSuperAdmin = user.roles.some(
        (role) => role.role.name === 'Super Admin' && role.role.isSystemRole
      );

      if (isSuperAdmin) {
        can(Action.MANAGE, 'all');
      }

      return build({
        detectSubjectType: this.detectSubjectType as any,
      });
    } catch (error) {
      this.logger.error(
        `Error creating abilities for user ${userId}: ${error.message}`
      );

      // Return minimal abilities on error
      can(Action.READ, 'all', { isPublic: true });
      return build({
        detectSubjectType: this.detectSubjectType as any,
      });
    }
  }

  /**
   * Evaluates condition variables in the format $user.X to their actual values
   */
  private evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): Record<string, any> {
    if (!conditions || typeof conditions !== 'object') {
      return {};
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key] = this.evaluateConditions(value, context);
      } else if (typeof value === 'string' && value.startsWith('$')) {
        // Handle variable replacement for strings like $user.organizationId
        const path = value.substring(1).split('.');
        let contextValue: any = context;

        for (const segment of path) {
          if (contextValue === undefined) break;
          contextValue = contextValue[segment];
        }

        result[key] = contextValue ?? value;
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Maps a string subject name to its corresponding class
   */
  private mapSubjectToClass(subject: string): any {
    // Map string subject to actual class
    switch (subject) {
      case 'Organization':
        return Organization;
      case 'User':
        return User;
      case 'Department':
        return Department;
      case 'Role':
        return Role;
      case 'Permission':
        return Permission;
      case 'Patient':
        return Patient;
      case 'MedicalRecord':
        return MedicalRecord;
      case 'Appointment':
        return Appointment;
      case 'ShiftType':
        return ShiftType;
      case 'StaffProfile':
        return StaffProfile;
      case 'ShiftSchedule':
        return ShiftSchedule;
      case 'ShiftAttendance':
        return ShiftAttendance;
      case 'PayPeriod':
        return PayPeriod;
      case 'StaffPayment':
        return StaffPayment;
      case 'Invitation':
        return InvitationClass;
      case 'all':
        return 'all';
      default:
        return subject;
    }
  }

  /**
   * Detects the subject type at runtime
   */
  private detectSubjectType = (item: any): string | Subjects => {
    if (item instanceof Organization) return Organization.name;
    if (item instanceof User) return User.name;
    if (item instanceof Department) return Department.name;
    if (item instanceof Role) return Role.name;
    if (item instanceof Permission) return Permission.name;
    if (item instanceof Patient) return Patient.name;
    if (item instanceof MedicalRecord) return MedicalRecord.name;
    if (item instanceof Appointment) return Appointment.name;
    if (item instanceof ShiftType) return ShiftType.name;
    if (item instanceof StaffProfile) return StaffProfile.name;
    if (item instanceof ShiftSchedule) return ShiftSchedule.name;
    if (item instanceof ShiftAttendance) return ShiftAttendance.name;
    if (item instanceof PayPeriod) return PayPeriod.name;
    if (item instanceof StaffPayment) return StaffPayment.name;
    if (item instanceof InvitationClass) return InvitationClass.name;

    // Handle plain objects with a "__type" property
    if (item && typeof item === 'object' && '__type' in item) {
      return item.__type;
    }

    // Handle Prisma objects based on their keys
    if (item && typeof item === 'object' && 'id' in item) {
      if ('category' in item && 'name' in item) return Organization.name;
      if ('email' in item && 'firstName' in item) return User.name;
      if ('name' in item && 'organizationId' in item && 'parentId' in item)
        return Department.name;
      if ('name' in item && 'isSystemRole' in item) return Role.name;
      if ('action' in item && 'subject' in item) return Permission.name;
      if ('medicalRecordNumber' in item) return Patient.name;
      if ('staffType' in item) return StaffProfile.name;
      if ('shiftTypeId' in item && 'startDateTime' in item)
        return ShiftSchedule.name;
      if ('shiftScheduleId' in item && 'overtimeMinutes' in item)
        return ShiftAttendance.name;
      if ('startDate' in item && 'endDate' in item) return PayPeriod.name;
      if ('staffProfileId' in item && 'payPeriodId' in item)
        return StaffPayment.name;
      if ('token' in item && 'expiresAt' in item) return InvitationClass.name;
    }

    return 'all';
  };
}
