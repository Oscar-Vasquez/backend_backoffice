/**
 * Script para optimizar el rendimiento con alta latencia
 * Implementa y configura estrategias para reducir el impacto de la alta latencia
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function optimizeForHighLatency() {
  console.log('🚀 Iniciando optimizaciones para alta latencia...');
  
  // Crear un pool de conexiones optimizado
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 30,                        // Máximo número de conexiones en el pool
    idleTimeoutMillis: 30000,       // Tiempo de espera para conexiones inactivas
    connectionTimeoutMillis: 10000, // Tiempo de espera para conexión
    statement_timeout: 20000,       // Tiempo máximo para la ejecución de consultas
    query_timeout: 10000,           // Tiempo máximo para la ejecución de consultas
  });
  
  try {
    // 1. Probar el pool de conexiones
    console.log('\n📊 Paso 1: Verificando pool de conexiones...');
    console.log('  Conectando a la base de datos...');
    
    const client = await pool.connect();
    
    console.log('  ✅ Conexión establecida');
    
    // Probar rendimiento con conexiones reutilizadas
    console.log('  Probando rendimiento con conexiones reutilizadas...');
    
    const startTime = Date.now();
    for (let i = 0; i < 5; i++) {
      await client.query('SELECT 1');
    }
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 5;
    
    console.log(`  ✅ Tiempo promedio por consulta: ${avgTime.toFixed(2)}ms`);
    
    client.release();
    
    // 2. Analizar y optimizar consultas frecuentes
    console.log('\n📊 Paso 2: Analizando consultas frecuentes...');
    
    // Lista de consultas frecuentes con su versión optimizada
    const frequentQueries = [
      {
        description: 'Listado de operadores',
        original: `
          SELECT o.*, b.name as branch_name 
          FROM operators o 
          LEFT JOIN branches b ON o.branch_id = b.id 
          ORDER BY o.created_at DESC 
          LIMIT 20 OFFSET 0
        `,
        optimized: `
          SELECT 
            o.id, o.email, o.first_name, o.last_name, o.role, o.status, 
            o.branch_id, o.created_at, b.name as branch_name
          FROM operators o 
          LEFT JOIN branches b ON o.branch_id = b.id 
          ORDER BY o.created_at DESC 
          LIMIT 20 OFFSET 0
        `,
        explanation: 'Seleccionar solo las columnas necesarias reduce la cantidad de datos transferidos'
      },
      {
        description: 'Actividades de un operador (simulado)',
        original: `
          SELECT a.* 
          FROM activities a 
          WHERE a.operator_id = '00000000-0000-0000-0000-000000000000'
          ORDER BY a.created_at DESC 
          LIMIT 20 OFFSET 0
        `,
        optimized: `
          SELECT 
            a.id, a.type, a.action, a.description, a.status, 
            a.created_at, a.operator_id, a.branch_id
          FROM activities a 
          WHERE a.operator_id = '00000000-0000-0000-0000-000000000000'
          ORDER BY a.created_at DESC 
          LIMIT 20 OFFSET 0
        `,
        explanation: 'Seleccionar solo las columnas necesarias reduce la cantidad de datos transferidos'
      },
      {
        description: 'Búsqueda de operadores (simulado)',
        original: `
          SELECT o.*, b.name as branch_name 
          FROM operators o 
          LEFT JOIN branches b ON o.branch_id = b.id 
          WHERE o.first_name ILIKE '%test%' OR o.last_name ILIKE '%test%' OR o.email ILIKE '%test%'
          ORDER BY o.created_at DESC 
          LIMIT 20 OFFSET 0
        `,
        optimized: `
          WITH filtered_operators AS (
            SELECT o.id
            FROM operators o
            WHERE o.first_name ILIKE '%test%' OR o.last_name ILIKE '%test%' OR o.email ILIKE '%test%'
            ORDER BY o.created_at DESC 
            LIMIT 20 OFFSET 0
          )
          SELECT 
            o.id, o.email, o.first_name, o.last_name, o.role, o.status, 
            o.branch_id, o.created_at, b.name as branch_name
          FROM operators o 
          INNER JOIN filtered_operators fo ON o.id = fo.id
          LEFT JOIN branches b ON o.branch_id = b.id 
          ORDER BY o.created_at DESC
        `,
        explanation: 'Usar CTE para filtrar primero y luego hacer JOIN reduce la cantidad de filas procesadas'
      }
    ];
    
    // Probar y explicar cada consulta
    for (const query of frequentQueries) {
      console.log(`\n  📝 ${query.description}:`);
      console.log(`  Explicación: ${query.explanation}`);
      console.log('  Midiendo rendimiento...');
      
      try {
        // Ejecutar EXPLAIN en la consulta original
        const explainOriginal = await pool.query('EXPLAIN ANALYZE ' + query.original);
        console.log('  Original:');
        explainOriginal.rows.forEach(row => {
          console.log(`    ${row['QUERY PLAN']}`);
        });
        
        // Ejecutar EXPLAIN en la consulta optimizada
        const explainOptimized = await pool.query('EXPLAIN ANALYZE ' + query.optimized);
        console.log('  Optimizada:');
        explainOptimized.rows.forEach(row => {
          console.log(`    ${row['QUERY PLAN']}`);
        });
      } catch (error) {
        console.log(`  Error al analizar consulta: ${error.message}`);
      }
    }
    
    // 3. Crear script de implementación de caché
    console.log('\n📊 Paso 3: Generando estrategia de caché...');
    
    const cachePath = path.join(__dirname, 'cache-strategy.md');
    const cacheStrategy = `# Estrategia de Caché para Alta Latencia

## Entornos con alta latencia detectados

* Host: ${process.env.DATABASE_URL.match(/aws-[^:]*\.supabase\.com/)[0]}
* Tiempo promedio de conexión: ~2-5 segundos
* Tiempo promedio de consulta: ~150-700ms

## Recomendaciones

### 1. Implementación de pool de conexiones

El pool de conexiones debe ser configurado con:

\`\`\`typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 30,                        // Máximo número de conexiones
  idleTimeoutMillis: 30000,       // Tiempo máximo de inactividad: 30 segundos
  connectionTimeoutMillis: 10000, // Tiempo máximo de conexión: 10 segundos
  statement_timeout: 20000,       // Timeout para consultas: 20 segundos
  query_timeout: 10000,           // Timeout para consultas: 10 segundos
});
\`\`\`

### 2. Estrategia de caché por niveles

#### 2.1 Caché en memoria (Nivel 1)

* Implementar caché en memoria para datos de lectura frecuente y baja escritura
* Tiempo de vida (TTL): 
  - Datos estáticos: 24 horas
  - Datos semi-estáticos: 1 hora
  - Datos dinámicos: 5 minutos

\`\`\`typescript
// Ejemplo de implementación para operadores
export class OperatorsCacheService {
  private cache = new Map<string, { data: any, expiresAt: number }>();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }
}
\`\`\`

#### 2.2 Estrategia de invalidación

* Invalidar caché al crear, actualizar o eliminar registros
* Implementar invalidación por patrones para actualizar conjuntos relacionados
* Usar un esquema de versión para invalidar la caché solo cuando sea necesario

\`\`\`typescript
// Ejemplo de invalidación
async update(operatorId: string, data: UpdateOperatorDto): Promise<Operator> {
  // Actualizar en base de datos
  const operator = await this.prisma.operators.update({
    where: { id: operatorId },
    data
  });
  
  // Invalidar caché
  this.cache.invalidate(\`operator:\${operatorId}\`);
  this.cache.invalidatePattern('operators:list:*');
  
  return this.mapOperatorData(operator);
}
\`\`\`

### 3. Reducción de consultas

* Implementar N+1 Select Problem resolver
* Usar dataloader para agrupar consultas relacionadas
* Aplicar paginación eficiente con keyset/cursor en lugar de offset

\`\`\`typescript
// Ejemplo de N+1 resolver
async findOperatorsWithBranches(ids: string[]): Promise<Map<string, Operator>> {
  // Obtener todos los operadores en una sola consulta
  const operators = await this.prisma.operators.findMany({
    where: { id: { in: ids } }
  });
  
  // Obtener todas las sucursales en una sola consulta
  const branchIds = [...new Set(operators.filter(o => o.branch_id).map(o => o.branch_id))];
  const branches = await this.prisma.branches.findMany({
    where: { id: { in: branchIds } }
  });
  
  // Mapear sucursales por ID
  const branchMap = new Map(branches.map(b => [b.id, b]));
  
  // Asociar cada operador con su sucursal
  return new Map(operators.map(o => [
    o.id, 
    this.mapOperatorData({
      ...o,
      branches: o.branch_id ? branchMap.get(o.branch_id) : null
    })
  ]));
}
\`\`\`

### 4. Monitoreo continuo

* Implementar middleware para detectar consultas lentas
* Establecer alertas para latencias mayores al umbral definido
* Realizar auditoría periódica de patrones de consulta

## Plan de implementación

1. Implementar pool de conexiones
2. Configurar middleware de monitoreo de consultas
3. Implementar caché en memoria para entidades prioritarias
4. Optimizar consultas críticas
5. Implementar estrategia de invalidación
6. Configurar monitoreo y alertas

`;
    
    fs.writeFileSync(cachePath, cacheStrategy);
    console.log(`  ✅ Estrategia de caché generada en: ${cachePath}`);
    
    // 4. Implementar configuración de pool optimizada
    console.log('\n📊 Paso 4: Generando configuración de pool optimizada...');
    
    const poolConfigPath = path.join(__dirname, '..', 'config', 'optimized-pool.config.ts');
    const poolConfig = `import { Pool, PoolConfig } from 'pg';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuración optimizada de pool para entornos con alta latencia
 */
@Injectable()
export class OptimizedPoolService {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const poolConfig: PoolConfig = {
      connectionString: this.configService.get<string>('DATABASE_URL'),
      max: this.configService.get<number>('DB_MAX_CONNECTIONS', 30),
      idleTimeoutMillis: this.configService.get<number>('DB_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: this.configService.get<number>('DB_CONNECTION_TIMEOUT', 10000),
    };

    // Configuración adicional para Supabase con alta latencia
    const additionalConfig = {
      statement_timeout: this.configService.get<number>('DB_STATEMENT_TIMEOUT', 20000),
      query_timeout: this.configService.get<number>('DB_QUERY_TIMEOUT', 10000),
      application_name: 'workexpress_optimized',
    };

    this.pool = new Pool({
      ...poolConfig,
      ...additionalConfig,
    });

    // Manejar errores a nivel del pool
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Obtiene el pool de conexiones
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Obtiene una conexión del pool
   */
  async getClient() {
    return this.pool.connect();
  }

  /**
   * Ejecuta una consulta usando el pool
   */
  async query(text: string, params: any[] = []) {
    return this.pool.query(text, params);
  }

  /**
   * Ejecuta una transacción
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Cierra el pool al apagar la aplicación
   */
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
`;
    
    // Asegurarse de que el directorio existe
    const configDir = path.dirname(poolConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(poolConfigPath, poolConfig);
    console.log(`  ✅ Configuración de pool optimizada generada en: ${poolConfigPath}`);
    
    console.log('\n🎉 Optimizaciones para alta latencia completadas');
    console.log('\nPróximos pasos:');
    console.log('1. Revisar y aplicar la estrategia de caché generada');
    console.log('2. Integrar la configuración de pool optimizada en tu aplicación');
    console.log('3. Actualizar las consultas principales con las versiones optimizadas');
    console.log('4. Implementar un sistema de monitoreo para detectar problemas de rendimiento');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await pool.end();
    console.log('Conexión cerrada');
  }
}

optimizeForHighLatency(); 