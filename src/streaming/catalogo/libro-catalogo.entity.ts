import { Column, Entity, PrimaryColumn } from 'typeorm';

/** biblioteca-catalogo: el ultimo estado de cada libro, reconstruido desde el offset 0 de biblioteca.catalogo. */
@Entity({ name: 'catalogo_libros' })
export class LibroCatalogo {
  @PrimaryColumn({ name: 'libro_id', type: 'text' })
  libroId!: string;

  @Column({ type: 'text' })
  titulo!: string;

  @Column({ type: 'text' })
  autor!: string;

  @Column({ type: 'int', nullable: true })
  anio!: number | null;

  @Column({ type: 'int', nullable: true })
  paginas!: number | null;

  @Column({ type: 'text' })
  categoria!: string;

  @Column({ type: 'text', nullable: true })
  isbn13!: string | null;

  @Column({ type: 'int' })
  ejemplares!: number;

  @Column({ name: 'ultimo_tipo', type: 'text' })
  ultimoTipo!: string;

  @Column({ name: 'ultimo_evento_id', type: 'uuid' })
  ultimoEventoId!: string;

  @Column({ name: 'emitido_en', type: 'timestamptz' })
  emitidoEn!: Date;
}
