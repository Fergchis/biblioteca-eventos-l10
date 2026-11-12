import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumidorKafka } from '../consumidor-kafka.js';
import { EventoDto } from '../evento.dto.js';
import { TOPICS } from '../topics.js';
import { HistorialNegocio } from './historial.negocio.js';

/** Consumer group biblioteca-historial: solo prestamos, hacia prestamos_semana. Es el que se rebobina. */
@Injectable()
export class HistorialConsumidor extends ConsumidorKafka<EventoDto> {
  constructor(config: ConfigService, historial: HistorialNegocio) {
    super(config, { grupo: 'biblioteca-historial', topics: [TOPICS.prestamos], dto: EventoDto }, historial);
  }
}
