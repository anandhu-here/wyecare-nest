import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  seedPermissions(): { message: string } {
    return { message: 'Permissions seeded successfully' };
  }
}
