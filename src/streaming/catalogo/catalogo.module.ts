import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { CatalogoConsumidor } from './catalogo.consumidor.js';
import { CatalogoNegocio } from './catalogo.negocio.js';

@Module({
  imports: [PersistenciaModule],
  providers: [CatalogoNegocio, CatalogoConsumidor],
})
export class CatalogoModule {}
