# Guía de Documentación Swagger para WorkExpress API

## Introducción

Esta guía explica cómo documentar la API de WorkExpress utilizando Swagger a través de NestJS. La documentación de Swagger está disponible en la ruta `/api/docs` cuando el servidor está en ejecución.

## Configuración Básica

La configuración principal ya está implementada en `main.ts`. Esto incluye:

- Configuración del título, descripción y versión de la API
- Configuración de autenticación usando JWT
- Configuración de la ruta de la documentación (`/api/docs`)

## Pasos para Documentar un Controlador

### 1. Decorar el Controlador

Usa el decorador `@ApiTags` para categorizar el controlador:

```typescript
import { ApiTags } from '@nestjs/swagger';

@ApiTags('nombre-de-la-categoría')
@Controller('ruta')
export class MiControlador {
  // ...
}
```

### 2. Documentar DTOs

Transforma tus interfaces en clases y usa el decorador `@ApiProperty` para documentar las propiedades:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class MiDTO {
  @ApiProperty({
    description: 'Descripción de la propiedad',
    example: 'Ejemplo de valor',
    required: true, // opcional, por defecto es true
    type: String, // opcional, se infiere del tipo TypeScript
  })
  miPropiedad: string;
}
```

### 3. Documentar Endpoints

Usa los decoradores de Swagger para documentar cada endpoint:

```typescript
@ApiOperation({ summary: 'Descripción corta de la operación' })
@ApiResponse({ 
  status: 200, 
  description: 'Operación exitosa',
  type: TipoDeRespuesta, // opcional, especifica el tipo de respuesta
})
@ApiResponse({ 
  status: 400, 
  description: 'Error de solicitud' 
})
@ApiParam({ name: 'id', description: 'ID del recurso' }) // para parámetros de ruta
@ApiQuery({ name: 'filter', description: 'Filtro opcional' }) // para parámetros de consulta
@ApiBody({ type: TipoDelCuerpo }) // para documentar el cuerpo de la solicitud
@Get(':id')
miMetodo(@Param('id') id: string) {
  // ...
}
```

## Ejemplo Completo

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { MiServicio } from './mi.servicio';
import { MiDTO, MiRespuestaDTO } from './dto';

@ApiTags('mi-recurso')
@Controller('mi-recurso')
export class MiControlador {
  constructor(private readonly miServicio: MiServicio) {}

  @ApiOperation({ summary: 'Obtener todos los recursos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de recursos',
    type: [MiRespuestaDTO],
  })
  @Get()
  obtenerTodos() {
    return this.miServicio.obtenerTodos();
  }

  @ApiOperation({ summary: 'Obtener un recurso por ID' })
  @ApiParam({ name: 'id', description: 'ID del recurso' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recurso encontrado',
    type: MiRespuestaDTO,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Recurso no encontrado' 
  })
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.miServicio.obtenerPorId(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo recurso' })
  @ApiBody({ type: MiDTO })
  @ApiResponse({ 
    status: 201, 
    description: 'Recurso creado',
    type: MiRespuestaDTO,
  })
  @Post()
  crear(@Body() datos: MiDTO) {
    return this.miServicio.crear(datos);
  }
}
```

## Recomendaciones

1. **Mantén los ejemplos claros y relevantes**: Los ejemplos ayudan a entender cómo debe formatearse cada campo.
2. **Documenta todos los posibles códigos de respuesta**: Incluye errores comunes como 400, 401, 403, 404, etc.
3. **Agrupa endpoints relacionados** con el mismo tag para mantener la documentación organizada.
4. **Usa descripciones concisas pero informativas** para las operaciones y propiedades.
5. **Transforma todas las interfaces en clases** para que Swagger pueda generar la documentación correctamente.

## Recursos Adicionales

- [Documentación oficial de NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Swagger OpenAPI Specification](https://swagger.io/specification/)

## Solución de Problemas Comunes

### La respuesta no coincide con el DTO

Si recibes un error como:

```
Type 'X' is missing the following properties from type 'Y': ...
```

Asegúrate de que el DTO de respuesta refleje exactamente la estructura que devuelve el servicio. Puedes:

1. Modificar el DTO para que coincida con la respuesta del servicio
2. Transformar la respuesta del servicio para que coincida con el DTO

### Las propiedades anidadas no aparecen en la documentación

Para documentar correctamente objetos anidados, define una clase para cada objeto anidado:

```typescript
export class DireccionDTO {
  @ApiProperty()
  calle: string;
  
  @ApiProperty()
  ciudad: string;
}

export class UsuarioDTO {
  @ApiProperty()
  nombre: string;
  
  @ApiProperty({ type: DireccionDTO })
  direccion: DireccionDTO;
} 