export interface NotificationSettings {
  sms: {
    enabled: boolean;
    providers: {
      twilio: {
        enabled: boolean;
        fromNumber: string;
        templates?: Record<
          string,
          {
            body: string;
            active: boolean;
          }
        >;
      };
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  push: {
    enabled: boolean;
    providers: {
      fcm: {
        enabled: boolean;
        templates?: Record<
          string,
          {
            title: string;
            body: string;
            active: boolean;
          }
        >;
      };
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  email: {
    enabled: boolean;
    providers: {
      smtp: {
        enabled: boolean;
        fromEmail: string;
        templates?: Record<
          string,
          {
            subject: string;
            body: string;
            active: boolean;
          }
        >;
      };
    };
  };
}

export class NotificationSettingsDto implements NotificationSettings {
  sms!: {
    enabled: boolean;
    providers: {
      twilio: {
        enabled: boolean;
        fromNumber: string;
        templates?: Record<
          string,
          {
            body: string;
            active: boolean;
          }
        >;
      };
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  push!: {
    enabled: boolean;
    providers: {
      fcm: {
        enabled: boolean;
        templates?: Record<
          string,
          {
            title: string;
            body: string;
            active: boolean;
          }
        >;
      };
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  email!: {
    enabled: boolean;
    providers: {
      smtp: {
        enabled: boolean;
        fromEmail: string;
        templates?: Record<
          string,
          {
            subject: string;
            body: string;
            active: boolean;
          }
        >;
      };
    };
  };
}
