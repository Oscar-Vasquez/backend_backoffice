/**
 * Script para analizar y optimizar consultas problemáticas basado en logs
 * Este script analiza archivos de logs para identificar consultas lentas y sugerir optimizaciones
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');
require('dotenv').config();

// Configuración
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || './logs';
const SLOW_QUERY_THRESHOLD = process.env.PRISMA_SLOW_QUERY_THRESHOLD || 500;
const MAX_QUERIES_TO_ANALYZE = 20;

async function findProblematicQueries() {
  console.log('🔍 Analizando consultas problemáticas basado en logs...');

  // Estructura para registrar consultas problemáticas
  const problematicQueries = {};
  
  // Buscar archivos de log
  const logFiles = findLogFiles(LOG_DIRECTORY);
  console.log(`Encontrados ${logFiles.length} archivos de log para analizar`);
  
  // Analizar cada archivo de log
  for (const logFile of logFiles) {
    console.log(`Analizando ${path.basename(logFile)}...`);
    await analyzeLogFile(logFile, problematicQueries);
  }
  
  // Ordenar consultas por frecuencia y tiempo
  const sortedQueries = Object.entries(problematicQueries)
    .sort((a, b) => {
      // Primero por frecuencia, luego por tiempo promedio
      if (b[1].count !== a[1].count) {
        return b[1].count - a[1].count;
      }
      return b[1].avgTime - a[1].avgTime;
    })
    .slice(0, MAX_QUERIES_TO_ANALYZE);
  
  console.log(`\n📊 Top ${sortedQueries.length} consultas problemáticas:`);
  
  // Cliente de base de datos para análisis EXPLAIN
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos para análisis detallado...');
    await pgClient.connect();
    
    // Analizar cada consulta problemática
    for (let i = 0; i < sortedQueries.length; i++) {
      const [queryKey, stats] = sortedQueries[i];
      const { query, count, totalTime, endpoints } = stats;
      const avgTime = Math.round(totalTime / count);
      
      console.log(`\n🔴 #${i + 1}: Consulta ejecutada ${count} veces, promedio ${avgTime}ms`);
      console.log(`Query: ${query.substring(0, 150)}${query.length > 150 ? '...' : ''}`);
      console.log(`Endpoints: ${Array.from(endpoints).join(', ')}`);
      
      // Analizar consulta con EXPLAIN ANALYZE
      try {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const explainResult = await pgClient.query(explainQuery);
        
        console.log('\nPlan de ejecución:');
        explainResult.rows.forEach(row => {
          console.log(row['QUERY PLAN']);
        });
        
        // Analizar plan de ejecución para identificar posibles optimizaciones
        const optimizationSuggestions = analyzeQueryPlan(explainResult.rows);
        
        if (optimizationSuggestions.length > 0) {
          console.log('\nSugerencias de optimización:');
          optimizationSuggestions.forEach((suggestion, idx) => {
            console.log(`${idx + 1}. ${suggestion}`);
          });
        }
      } catch (error) {
        console.log(`No se pudo analizar la consulta: ${error.message}`);
      }
    }
    
    // Sugerencias generales
    console.log('\n📝 Recomendaciones generales basadas en patrones observados:');
    const generalRecommendations = generateGeneralRecommendations(problematicQueries);
    generalRecommendations.forEach((recommendation, idx) => {
      console.log(`${idx + 1}. ${recommendation}`);
    });
    
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  } finally {
    if (pgClient) await pgClient.end();
  }
}

/**
 * Encuentra archivos de log en el directorio especificado
 */
function findLogFiles(directory) {
  const logFiles = [];
  
  if (!fs.existsSync(directory)) {
    console.warn(`Directorio de logs no encontrado: ${directory}`);
    return logFiles;
  }
  
  // Buscar archivos que contengan slow-query o error en el nombre
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile() && (
      file.includes('application') || 
      file.includes('error') || 
      file.includes('combined') ||
      file.includes('warn')
    )) {
      logFiles.push(fullPath);
    }
  }
  
  return logFiles;
}

/**
 * Analiza un archivo de log buscando consultas lentas
 */
async function analyzeLogFile(filePath, problematicQueries) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    // Buscar líneas que contengan "Consulta lenta" o "slow query"
    if (line.toLowerCase().includes('consulta lenta') || 
        line.toLowerCase().includes('slow query') ||
        line.toLowerCase().includes('query took')) {
      
      try {
        // Extraer información relevante
        const queryMatch = line.match(/query:?\s*([^,]+)/i) || line.match(/:\s*(SELECT|UPDATE|DELETE|INSERT)/i);
        if (!queryMatch) continue;
        
        const query = queryMatch[1].trim();
        
        // Extraer tiempo
        const timeMatch = line.match(/(\d+(?:\.\d+)?)ms/);
        const executionTime = timeMatch ? parseFloat(timeMatch[1]) : SLOW_QUERY_THRESHOLD;
        
        // Extraer endpoint si está disponible
        const endpointMatch = line.match(/endpoint:?\s*([^,\]]+)/i) || line.match(/path:?\s*([^,\]]+)/i);
        const endpoint = endpointMatch ? endpointMatch[1].trim() : 'unknown';
        
        // Normalizar la consulta para agrupar similares
        const queryKey = normalizeQuery(query);
        
        // Actualizar estadísticas
        if (!problematicQueries[queryKey]) {
          problematicQueries[queryKey] = {
            query,
            count: 0,
            totalTime: 0,
            endpoints: new Set()
          };
        }
        
        problematicQueries[queryKey].count++;
        problematicQueries[queryKey].totalTime += executionTime;
        problematicQueries[queryKey].endpoints.add(endpoint);
      } catch (error) {
        console.warn(`Error al analizar línea de log: ${error.message}`);
      }
    }
  }
}

/**
 * Normaliza una consulta para poder agrupar similares
 */
function normalizeQuery(query) {
  // Reemplazar valores literales con placeholders
  return query
    .replace(/'[^']*'/g, '?')     // Reemplazar strings
    .replace(/\d+/g, '#')         // Reemplazar números
    .replace(/\s+/g, ' ')         // Normalizar espacios
    .trim();
}

/**
 * Analiza el plan de ejecución para identificar posibles problemas
 */
function analyzeQueryPlan(planRows) {
  const planText = planRows.map(row => row['QUERY PLAN']).join(' ');
  const suggestions = [];
  
  // Buscar patrones de problemas comunes
  if (planText.includes('Seq Scan') && !planText.includes('cost=0.00')) {
    suggestions.push('La consulta está realizando un escaneo secuencial. Considere agregar un índice apropiado.');
  }
  
  if (planText.includes('Bitmap Heap Scan') && planText.includes('recheck')) {
    suggestions.push('El índice está siendo recalculado. Considere revisar la selectividad del índice.');
  }
  
  if (planText.includes('Hash Join') && planText.match(/rows=(\d+)/) && parseInt(RegExp.$1) > 1000) {
    suggestions.push('Join con gran cantidad de filas. Considere limitar los resultados antes del join o usar índices para las condiciones de join.');
  }
  
  if (planText.includes('Sort') && planText.match(/Sort Method: external/)) {
    suggestions.push('La ordenación requiere disco. Considere aumentar work_mem o limitar los resultados antes de ordenar.');
  }
  
  if (planText.includes('Nested Loop') && planText.match(/loops=(\d+)/) && parseInt(RegExp.$1) > 100) {
    suggestions.push('Bucle anidado con muchas iteraciones. Verifique las condiciones de join y considere un índice para la tabla interna.');
  }
  
  return suggestions;
}

/**
 * Genera recomendaciones generales basadas en patrones de consultas
 */
function generateGeneralRecommendations(problematicQueries) {
  const recommendations = [];
  const queries = Object.values(problematicQueries);
  
  // Buscar patrones de tablas más consultadas
  const tableUsage = {};
  const joinPatterns = {};
  
  for (const { query } of queries) {
    // Extraer tablas involucradas
    const tableMatches = query.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi);
    if (tableMatches) {
      const tables = tableMatches.map(match => {
        const parts = match.split(/\s+/);
        return parts[parts.length - 1];
      });
      
      // Registrar uso de tablas
      tables.forEach(table => {
        tableUsage[table] = (tableUsage[table] || 0) + 1;
      });
      
      // Registrar patrones de join
      if (tables.length > 1) {
        const joinKey = tables.sort().join('-');
        joinPatterns[joinKey] = (joinPatterns[joinKey] || 0) + 1;
      }
    }
  }
  
  // Encontrar tablas más frecuentes
  const topTables = Object.entries(tableUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([table]) => table);
  
  if (topTables.length > 0) {
    recommendations.push(`Considere optimizar especialmente las tablas: ${topTables.join(', ')}`);
    recommendations.push(`Verifique que estas tablas tengan índices adecuados según los patrones de consulta`);
  }
  
  // Encontrar joins frecuentes
  const topJoins = Object.entries(joinPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([join]) => join);
  
  if (topJoins.length > 0) {
    recommendations.push(`Revise los joins frecuentes: ${topJoins.join(', ')}`);
    recommendations.push(`Asegúrese de que existan índices para las claves de join`);
  }
  
  // Recomendaciones generales adicionales
  recommendations.push('Implemente caché para consultas frecuentes, especialmente las que no cambian a menudo');
  recommendations.push('Considere la paginación con cursor en lugar de OFFSET para conjuntos grandes de datos');
  recommendations.push('Revise regularmente las estadísticas de la base de datos (ANALYZE)');
  
  return recommendations;
}

// Ejecutar script
findProblematicQueries()
  .then(() => console.log('Análisis completado'))
  .catch(error => console.error('Error durante el análisis:', error)); 