import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Procesador, Resultado } from '../consumidor-kafka.js';
import type { EventoDto } from '../evento.dto.js';

const GRUPO = 'biblioteca-historial';

/**
 * Lo que hace biblioteca-historial con un evento valido, en UNA transaccion con eventos_procesados:
 * - prestamo.creado: guarda el prestamo (semana y libro) y suma un prestado y un activo.
 * - prestamo.devuelto: busca su prestamo por prestamoId, lo marca devuelto y, en la semana y el libro DEL
 *   PRESTAMO, suma un devuelto y resta un activo. La semana es el lunes, en hora de Chile, de emitidoEn.
 */
@Injectable()
export class HistorialNegocio implements Procesador<EventoDto> {
  private readonly log = new Logger(GRUPO);

  constructor(private readonly base: DataSource) {}

  async procesar(e: EventoDto): Promise<Resultado> {
    const { prestamoId } = e.datos as { prestamoId: string };
    return this.base.transaction(async (tx) => {
      const nuevo: unknown[] = await tx.query(
        `INSERT INTO eventos_procesados (grupo, evento_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING evento_id`,
        [GRUPO, e.eventoId],
      );
      if (nuevo.length === 0) return 'duplicado';

      if (e.tipo === 'prestamo.creado') {
        const [p] = await tx.query<{ semana: string }[]>(
          `INSERT INTO prestamos_vistos (prestamo_id, semana, libro_id, devuelto)
           VALUES ($1, date_trunc('week', $2::timestamptz AT TIME ZONE 'America/Santiago')::date, $3, false)
           ON CONFLICT (prestamo_id) DO NOTHING RETURNING semana::text AS semana`,
          [prestamoId, e.emitidoEn, e.libroId],
        );
        if (!p) {
          this.log.warn(`prestamo ${prestamoId} ya registrado con otro evento: no suma`);
          return 'nuevo';
        }
        await tx.query(
          `INSERT INTO prestamos_semana (semana, libro_id, prestados, devueltos, activos) VALUES ($1, $2, 1, 0, 1)
           ON CONFLICT (semana, libro_id) DO UPDATE
             SET prestados = prestamos_semana.prestados + 1, activos = prestamos_semana.activos + 1`,
          [p.semana, e.libroId],
        );
        return 'nuevo';
      }

      if (e.tipo === 'prestamo.devuelto') {
        // Envuelto en un WITH ... SELECT: con un UPDATE ... RETURNING a secas, TypeORM devuelve [filas, cantidad]
        // en vez de las filas, y [p] seria el arreglo, no el prestamo.
        const [p] = await tx.query<{ semana: string; libro_id: string }[]>(
          `WITH devuelto AS (
             UPDATE prestamos_vistos SET devuelto = true WHERE prestamo_id = $1 AND NOT devuelto
             RETURNING semana::text AS semana, libro_id)
           SELECT semana, libro_id FROM devuelto`,
          [prestamoId],
        );
        if (!p) {
          this.log.warn(`devolucion del prestamo ${prestamoId} sin prestamo pendiente: no resta`);
          return 'nuevo';
        }
        await tx.query(
          `UPDATE prestamos_semana SET devueltos = devueltos + 1, activos = activos - 1
            WHERE semana = $1 AND libro_id = $2`,
          [p.semana, p.libro_id],
        );
        return 'nuevo';
      }
      return 'ignorado';
    });
  }
}
