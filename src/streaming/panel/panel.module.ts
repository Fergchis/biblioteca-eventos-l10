import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { PanelConsumidor } from './panel.consumidor.js';
import { PanelNegocio } from './panel.negocio.js';

@Module({
  imports: [PersistenciaModule],
  providers: [PanelNegocio, PanelConsumidor],
})
export class PanelModule {}
