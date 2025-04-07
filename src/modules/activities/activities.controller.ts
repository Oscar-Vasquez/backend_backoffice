import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperatorActivity } from './interfaces/operator-activity.interface';

@ApiTags('actividades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva actividad' })
  @ApiResponse({ 
    status: 201, 
    description: 'Actividad creada exitosamente',
    type: CreateActivityDto
  })
  async createActivity(@Body() createActivityDto: CreateActivityDto): Promise<OperatorActivity> {
    return this.activitiesService.createActivity(createActivityDto);
  }

  @Get('operator/:operatorId')
  @ApiOperation({ summary: 'Obtener actividades de un operador específico' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de actividades del operador',
    type: [CreateActivityDto]
  })
  async getOperatorActivities(
    @Param('operatorId') operatorId: string,
    @Query('limit') limit?: string
  ): Promise<OperatorActivity[]> {
    console.log('🔍 Buscando actividades para el operador:', operatorId);
    const activities = await this.activitiesService.getOperatorActivities(
      operatorId,
      limit ? parseInt(limit) : undefined
    );
    console.log(`📊 Se encontraron ${activities.length} actividades`);
    return activities;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener actividades recientes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de actividades recientes',
    type: [CreateActivityDto]
  })
  async getRecentActivities(
    @Query('limit') limit?: string,
    @Query('days') days?: string
  ): Promise<OperatorActivity[]> {
    return this.activitiesService.getRecentActivities(
      limit ? parseInt(limit) : undefined,
      days ? parseInt(days) : undefined
    );
  }
} 