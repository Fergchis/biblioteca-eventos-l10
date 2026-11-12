import { Type } from 'class-transformer';
import {
  Equals, IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested,
} from 'class-validator';

export const TIPOS_CATALOGO = ['libro.publicado', 'libro.actualizado'] as const;

/** El estado completo del libro: cada evento del catalogo lo trae entero (por eso se puede compactar). */
export class DatosLibroDto {
  @IsString() @IsNotEmpty() titulo!: string;
  @IsString() @IsNotEmpty() autor!: string;
  @IsOptional() @IsInt() anio!: number | null;
  @IsOptional() @IsInt() @Min(1) paginas!: number | null;
  @IsString() @IsNotEmpty() categoria!: string;
  @IsOptional() @IsString() isbn13!: string | null;
  @IsInt() @Min(0) ejemplares!: number;
}

/** Sobre de biblioteca.catalogo (key libroId). Sin usuarioSub: lo publica el servicio, no un lector. */
export class EventoCatalogoDto {
  @IsUUID() eventoId!: string;
  @IsIn(TIPOS_CATALOGO) tipo!: (typeof TIPOS_CATALOGO)[number];
  @Equals(1, { message: 'version tiene que ser 1' }) version!: number;
  @IsISO8601({ strict: true }) emitidoEn!: string;
  @IsString() @IsNotEmpty() libroId!: string;
  @ValidateNested() @Type(() => DatosLibroDto) datos!: DatosLibroDto;
}
