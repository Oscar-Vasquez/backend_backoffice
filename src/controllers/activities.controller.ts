import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ActivitiesService } from '../modules/activities/activities.service';
import { CreateActivityDto } from '../modules/activities/dto/create-activity.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async createActivity(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.createActivity(createActivityDto);
  }

  @Get()
  async getActivities() {
    return this.activitiesService.getRecentActivities();
  }
} 