import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Consumer,
  MessagesStream,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
  type Message,
} from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { EventoDto } from './evento.dto.js';
import { TOPICS } from './topics.js';

type Mensaje = Message<string, string, string, string>;

/**
 * Primer consumidor de Kafka: el grupo `biblioteca-panel` lee los dos topics, valida cada evento contra su DTO
 * y deja una linea en el log. Si un evento no es JSON o no valida, se registra y se CONFIRMA igual: uno solo
 * no puede detener al consumidor (en la E3 esos se desvian al .dlt). El commit va DESPUES de procesar.
 */
@Injectable()
export class PanelConsumidor implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('biblioteca-panel');
  private readonly consumidor: Consumer<string, string, string, string>;
  private flujo?: MessagesStream<string, string, string, string>;

  constructor(config: ConfigService) {
    this.consumidor = new Consumer({
      groupId: 'biblioteca-panel',
      clientId: 'biblioteca-eventos',
      bootstrapBrokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
      deserializers: stringDeserializers,
    });
  }

  async onModuleInit(): Promise<void> {
    this.flujo = await this.consumidor.consume({
      topics: [TOPICS.prestamos, TOPICS.lecturas],
      autocommit: false,
      mode: MessagesStreamModes.COMMITTED,
      fallbackMode: MessagesStreamFallbackModes.EARLIEST,
    });
    this.log.log(`grupo biblioteca-panel leyendo ${TOPICS.prestamos} y ${TOPICS.lecturas}`);
    void this.leer(); // sin await: si no, Nest no termina de arrancar
  }

  private async leer(): Promise<void> {
    try {
      for await (const m of this.flujo!) {
        this.registrar(m);
        await m.commit(); // despues de procesar, tambien si era invalido
      }
    } catch (error) {
      this.log.error(`el consumidor se detuvo: ${(error as Error).message}`);
    }
  }

  private registrar(m: Mensaje): void {
    const donde = `${m.topic}[${m.partition}]@${m.offset}`;
    try {
      const evento = plainToInstance(EventoDto, JSON.parse(m.value));
      const errores = validateSync(evento, { whitelist: true, forbidNonWhitelisted: true });
      if (errores.length > 0) {
        this.log.warn(`${donde} INVALIDO: ${motivos(errores).join('; ')}`);
        return;
      }
      this.log.log(`${donde} ${evento.tipo} evento ${evento.eventoId} libro ${evento.libroId} usuario ${evento.usuarioSub}`);
    } catch (error) {
      this.log.warn(`${donde} INVALIDO: no es un JSON de evento (${(error as Error).message})`);
    }
  }

  // Con app.enableShutdownHooks() en main.ts. Con close() el siguiente arranque tarda milisegundos;
  // sin el, Kafka espera cerca de un minuto a dar por muerto al consumidor anterior.
  async onModuleDestroy(): Promise<void> {
    await this.flujo?.close();
    await this.consumidor.close();
  }
}

// "version (equals)", "datos.desde (matches)": que propiedad falla y que regla incumple.
function motivos(errores: ValidationError[], ruta = ''): string[] {
  return errores.flatMap((e) => [
    ...(e.constraints ? [`${ruta}${e.property} (${Object.keys(e.constraints).join(', ')})`] : []),
    ...motivos(e.children ?? [], `${ruta}${e.property}.`),
  ]);
}
