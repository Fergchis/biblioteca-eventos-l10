import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Procesador, Resultado } from '../consumidor-kafka.js';
import type { EventoCatalogoDto } from './evento-catalogo.dto.js';

/**
 * Lo que hace biblioteca-catalogo: deja en catalogo_libros el ultimo estado de cada libro. Cada evento trae el
 * libro completo, asi que basta con escribirlo encima. El WHERE evita volver atras si se relee un evento mas
 * antiguo que el guardado (por ejemplo, al reconstruir desde el offset 0 antes de que el topic se compacte).
 */
@Injectable()
export class CatalogoNegocio implements Procesador<EventoCatalogoDto> {
  constructor(private readonly base: DataSource) {}

  async procesar(e: EventoCatalogoDto): Promise<Resultado> {
    const d = e.datos;
    const filas: unknown[] = await this.base.query(
      `INSERT INTO catalogo_libros
         (libro_id, titulo, autor, anio, paginas, categoria, isbn13, ejemplares, ultimo_tipo, ultimo_evento_id, emitido_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (libro_id) DO UPDATE SET
         titulo = EXCLUDED.titulo, autor = EXCLUDED.autor, anio = EXCLUDED.anio, paginas = EXCLUDED.paginas,
         categoria = EXCLUDED.categoria, isbn13 = EXCLUDED.isbn13, ejemplares = EXCLUDED.ejemplares,
         ultimo_tipo = EXCLUDED.ultimo_tipo, ultimo_evento_id = EXCLUDED.ultimo_evento_id, emitido_en = EXCLUDED.emitido_en
       WHERE catalogo_libros.emitido_en < EXCLUDED.emitido_en
       RETURNING libro_id`,
      [e.libroId, d.titulo, d.autor, d.anio ?? null, d.paginas ?? null, d.categoria, d.isbn13 ?? null, d.ejemplares,
        e.tipo, e.eventoId, e.emitidoEn],
    );
    return filas.length === 1 ? 'nuevo' : 'duplicado';
  }
}
