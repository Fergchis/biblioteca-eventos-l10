import { Column, Entity, PrimaryColumn } from 'typeorm';

/** biblioteca-historial: por semana (lunes, hora de Chile) y libro, prestados, devueltos y activos. */
@Entity({ name: 'prestamos_semana' })
export class PrestamoSemana {
  @PrimaryColumn({ type: 'date' })
  semana!: string;

  @PrimaryColumn({ name: 'libro_id', type: 'text' })
  libroId!: string;

  @Column({ type: 'int' })
  prestados!: number;

  @Column({ type: 'int' })
  devueltos!: number;

  @Column({ type: 'int' })
  activos!: number;
}
