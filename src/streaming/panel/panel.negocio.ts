import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Procesador, Resultado } from '../consumidor-kafka.js';
import type { EventoDto } from '../evento.dto.js';
import { minutoDe } from '../ventanas.js';

const CUENTAN = ['lectura.iniciada', 'lectura.terminada', 'prestamo.creado'];

/**
 * Lo que hace biblioteca-panel con un evento valido: una fila en kpi_minuto. Si el evento_id ya estaba, el
 * INSERT no hace nada y se informa como duplicado. No sabe nada de Kafka.
 */
@Injectable()
export class PanelNegocio implements Procesador<EventoDto> {
  constructor(private readonly base: DataSource) {}

  async procesar(e: EventoDto): Promise<Resultado> {
    if (!CUENTAN.includes(e.tipo)) return 'ignorado';
    const filas: unknown[] = await this.base.query(
      `INSERT INTO kpi_minuto (evento_id, minuto, libro_id, tipo) VALUES ($1, $2, $3, $4)
       ON CONFLICT (evento_id) DO NOTHING RETURNING evento_id`,
      [e.eventoId, minutoDe(e.emitidoEn), e.libroId, e.tipo],
    );
    return filas.length === 1 ? 'nuevo' : 'duplicado';
  }
}
