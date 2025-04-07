# Estrategia de Caché para Alta Latencia

## Entornos con alta latencia detectados

* Host: aws-0-us-west-1.pooler.supabase.com
* Tiempo promedio de conexión: ~2-5 segundos
* Tiempo promedio de consulta: ~150-700ms

## Recomendaciones

### 1. Implementación de pool de conexiones

El pool de conexiones debe ser configurado con:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 30,                        // Máximo número de conexiones
  idleTimeoutMillis: 30000,       // Tiempo máximo de inactividad: 30 segundos
  connectionTimeoutMillis: 10000, // Tiempo máximo de conexión: 10 segundos
  statement_timeout: 20000,       // Timeout para consultas: 20 segundos
  query_timeout: 10000,           // Timeout para consultas: 10 segundos
});
```

### 2. Estrategia de caché por niveles

#### 2.1 Caché en memoria (Nivel 1)

* Implementar caché en memoria para datos de lectura frecuente y baja escritura
* Tiempo de vida (TTL): 
  - Datos estáticos: 24 horas
  - Datos semi-estáticos: 1 hora
  - Datos dinámicos: 5 minutos

```typescript
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
```

#### 2.2 Estrategia de invalidación

* Invalidar caché al crear, actualizar o eliminar registros
* Implementar invalidación por patrones para actualizar conjuntos relacionados
* Usar un esquema de versión para invalidar la caché solo cuando sea necesario

```typescript
// Ejemplo de invalidación
async update(operatorId: string, data: UpdateOperatorDto): Promise<Operator> {
  // Actualizar en base de datos
  const operator = await this.prisma.operators.update({
    where: { id: operatorId },
    data
  });
  
  // Invalidar caché
  this.cache.invalidate(`operator:${operatorId}`);
  this.cache.invalidatePattern('operators:list:*');
  
  return this.mapOperatorData(operator);
}
```

### 3. Reducción de consultas

* Implementar N+1 Select Problem resolver
* Usar dataloader para agrupar consultas relacionadas
* Aplicar paginación eficiente con keyset/cursor en lugar de offset

```typescript
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
```

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

