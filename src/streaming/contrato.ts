import type { Message } from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';

export type Mensaje = Message<string, string, string, string>;

/** Un mensaje que no cumple el contrato: no se reintenta, se registra y se confirma (en la E3, al .dlt). */
export class EventoInvalido extends Error {}

/**
 * El contrato de un topic: convierte el value del mensaje en el DTO validado, o lanza EventoInvalido con el
 * motivo. No sabe nada de Kafka mas alla del value, ni de Postgres.
 */
export class Contrato<T extends object> {
  constructor(private readonly dto: new () => T) {}

  validar(m: Mensaje): T {
    let crudo: unknown;
    try {
      crudo = JSON.parse(m.value);
    } catch (error) {
      throw new EventoInvalido(`no es un JSON de evento (${(error as Error).message})`);
    }
    const evento = plainToInstance(this.dto, crudo);
    const errores = validateSync(evento, { whitelist: true, forbidNonWhitelisted: true });
    if (errores.length > 0) throw new EventoInvalido(motivos(errores).join('; '));
    return evento;
  }
}

// "version (equals)", "datos.desde (matches)": que propiedad falla y que regla incumple.
function motivos(errores: ValidationError[], ruta = ''): string[] {
  return errores.flatMap((e) => [
    ...(e.constraints ? [`${ruta}${e.property} (${Object.keys(e.constraints).join(', ')})`] : []),
    ...motivos(e.children ?? [], `${ruta}${e.property}.`),
  ]);
}
