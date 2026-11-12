import { Module } from '@nestjs/common';
import { AlertasModule } from './alertas/alertas.module.js';
import { HistorialModule } from './historial/historial.module.js';
import { PanelModule } from './panel/panel.module.js';

// Un modulo por consumer group (L10): cada uno con su clase de Kafka y su clase de negocio.
@Module({
  imports: [PanelModule, AlertasModule, HistorialModule],
})
export class StreamingModule {}
