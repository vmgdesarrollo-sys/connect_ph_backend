// Este servicio utiliza AsyncLocalStorage para mantener un contexto de petición que permite almacenar y acceder al userId de forma segura en todas las peticiones realizadas, incluso en eventos asíncronos. 
// El middleware de contexto de petición se encarga de establecer el userId en este servicio para que esté disponible en los controladores, servicios y también en el subscriber de TypeORM.
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

  run(callback: () => void): void {
    this.asyncLocalStorage.run(new Map(), callback);
  }

  set(key: string, value: any): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get(key: string): any {
    const store = this.asyncLocalStorage.getStore();
    return store?.get(key);
  }

  getUserId(): string | undefined {
    return this.get('userId');
  }

  setUserId(userId: string): void {
    this.set('userId', userId);
  }
}
