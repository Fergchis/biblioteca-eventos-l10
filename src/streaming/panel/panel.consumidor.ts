import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumidorKafka } from '../consumidor-kafka.js';
import { EventoDto } from '../evento.dto.js';
import { TOPICS } from '../topics.js';
import { PanelNegocio } from './panel.negocio.js';

/** Consumer group biblioteca-panel: lecturas y prestamos, hacia kpi_minuto. */
@Injectable()
export class PanelConsumidor extends ConsumidorKafka<EventoDto> {
  constructor(config: ConfigService, panel: PanelNegocio) {
    super(config, { grupo: 'biblioteca-panel', topics: [TOPICS.lecturas, TOPICS.prestamos], dto: EventoDto }, panel);
  }
}
