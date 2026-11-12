import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumidorKafka } from '../consumidor-kafka.js';
import { TOPICS } from '../topics.js';
import { CatalogoNegocio } from './catalogo.negocio.js';
import { EventoCatalogoDto } from './evento-catalogo.dto.js';

/**
 * Consumer group biblioteca-catalogo (grupos de 3): biblioteca.catalogo, compactado, hacia catalogo_libros.
 * Lee SIEMPRE desde el offset 0: en cada arranque reconstruye la tabla con el ultimo estado de cada libro.
 */
@Injectable()
export class CatalogoConsumidor extends ConsumidorKafka<EventoCatalogoDto> {
  constructor(config: ConfigService, catalogo: CatalogoNegocio) {
    super(
      config,
      { grupo: 'biblioteca-catalogo', topics: [TOPICS.catalogo], dto: EventoCatalogoDto, desdeElPrincipio: true },
      catalogo,
    );
  }
}
