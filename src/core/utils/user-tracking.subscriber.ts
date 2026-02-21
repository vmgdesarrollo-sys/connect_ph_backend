import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

@Injectable()
@EventSubscriber()
export class UserTrackingSubscriber implements EntitySubscriberInterface {
  // Inyectamos el DataSource para registrar el suscriptor y el servicio de contexto
  constructor(
    private readonly dataSource: DataSource,
    private readonly requestContext: RequestContextService
  ) {
    this.dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<any>): void {
    const userId = this.requestContext.getUserId();
    if (userId && event.entity) {
      if ('created_by' in event.entity) event.entity.created_by = userId;
      if ('updated_by' in event.entity) event.entity.updated_by = userId;
    }
  }

  beforeUpdate(event: UpdateEvent<any>): void {
    const userId = this.requestContext.getUserId();
    if (userId && event.entity) {
      if ('updated_by' in event.entity) event.entity.updated_by = userId;
    }
  }
}