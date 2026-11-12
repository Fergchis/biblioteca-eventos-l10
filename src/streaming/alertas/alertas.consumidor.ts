import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumidorKafka } from '../consumidor-kafka.js';
import { EventoDto } from '../evento.dto.js';
import { TOPICS } from '../topics.js';
import { AlertasNegocio } from './alertas.negocio.js';

/** Consumer group biblioteca-alertas: solo lecturas, hacia ventanas_lectura y alertas. */
@Injectable()
export class AlertasConsumidor extends ConsumidorKafka<EventoDto> {
  constructor(config: ConfigService, alertas: AlertasNegocio) {
    super(config, { grupo: 'biblioteca-alertas', topics: [TOPICS.lecturas], dto: EventoDto }, alertas);
  }
}
