import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('subjects/:subjectId/topics')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.topicsService.findAllBySubject(subjectId);
  }

  @Post('subjects/:subjectId/topics')
  create(
    @CurrentUser('id') userId: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.topicsService.create(userId, subjectId, dto);
  }

  @Get('topics')
  findAll() {
    return this.topicsService.findAll();
  }

  @Get('topics/:id')
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Put('topics/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(id, dto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.topicsService.remove(id);
  }
}
