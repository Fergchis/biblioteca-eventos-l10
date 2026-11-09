import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { MensajeriaService } from '../mensajeria.service.js';
import { COLAS, EXCHANGES, ROUTING_KEYS } from '../topologia.js';

@Injectable()
export class NotificacionesConsumidor implements OnModuleInit {
  private readonly log = new Logger(NotificacionesConsumidor.name);

  constructor(private readonly mensajeria: MensajeriaService) {}

  async onModuleInit(): Promise<void> {
    const canal = this.mensajeria.canal;

    await canal.consume(
      COLAS.notificaciones,
      (mensaje: ConsumeMessage | null) => {
        if (!mensaje) return;

        try {
          const evento = JSON.parse(mensaje.content.toString()) as Record<string, unknown>;
          const rk = mensaje.fields.routingKey;
          // A quien: al usuario del evento. Este consumidor no consulta a otro servicio: lo que necesita viaja en el payload.
          if (typeof evento.usuarioSub !== 'string' || evento.usuarioSub === '') {
            throw new Error('el evento no trae usuarioSub');                  // mal formado: a la DLQ
          }
          // Si corresponde: solo los hechos que ameritan aviso tienen asunto.
          const asuntos: Record<string, string> = {
            [ROUTING_KEYS.prestamoCreado]: `Tu prestamo ${String(evento.prestamoId)}`,
            [ROUTING_KEYS.prestamoDevuelto]: `Devolviste el prestamo ${String(evento.prestamoId)}`,
          };
          const asunto = asuntos[rk];
          if (asunto) {
            this.log.log(`${rk} | aviso para ${String(evento.usuarioSub)}`);
            this.mensajeria.publicar(EXCHANGES.comandos.nombre, ROUTING_KEYS.correoEnviar, {
              para: evento.usuarioSub,
              asunto,
              cuerpo: `Libro ${String(evento.libroId)}.`,
              origen: rk,
              eventoId: mensaje.properties.headers?.['x-evento-id'],           // el x-evento-id del evento que origina el aviso (EP2 §4.1)
            });
          } else {
            this.log.log(`${rk} no amerita aviso`);
          }
          canal.ack(mensaje);
        } catch (error) {
          canal.nack(mensaje, false, false);        // fuera de la cola, y al DLX
          this.log.error(`rechazado hacia la DLQ: ${(error as Error).message}`);
        }
      },
      { noAck: false },
    );

    this.log.log(`escuchando la cola ${COLAS.notificaciones}`);
  }
}
