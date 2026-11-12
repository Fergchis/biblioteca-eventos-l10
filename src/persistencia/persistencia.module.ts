import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alerta } from '../streaming/alertas/alerta.entity.js';
import { VentanaLecturas } from '../streaming/alertas/ventana-lecturas.entity.js';
import { LibroCatalogo } from '../streaming/catalogo/libro-catalogo.entity.js';
import { EventoProcesado } from '../streaming/evento-procesado.entity.js';
import { PrestamoSemana } from '../streaming/historial/prestamo-semana.entity.js';
import { PrestamoVisto } from '../streaming/historial/prestamo-visto.entity.js';
import { KpiMinuto } from '../streaming/panel/kpi-minuto.entity.js';
import { EventoAuditoria } from './evento-auditoria.entity.js';
import { MensajeMuerto } from './mensaje-muerto.entity.js';
import { Notificacion } from './notificacion.entity.js';

// RabbitMQ (L5 a L8) y Kafka (L10): las tablas de lectura de los consumer groups.
const ENTIDADES = [
  EventoAuditoria, Notificacion, MensajeMuerto,
  KpiMinuto, EventoProcesado, VentanaLecturas, Alerta, PrestamoSemana, PrestamoVisto, LibroCatalogo,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST'),
        port: Number(config.get<string>('POSTGRES_PORT')),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: ENTIDADES,
        // ADVERTENCIA: synchronize crea y altera tablas solo. Desarrollo unicamente.
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature(ENTIDADES),
  ],
  exports: [TypeOrmModule],
})
export class PersistenciaModule {}
