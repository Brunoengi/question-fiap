import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryQuestionsDto,
  ) {
    return this.questionsService.findAll(userId, query);
  }

  @Get('trash')
  findTrash(
    @CurrentUser('id') userId: string,
    @Query() query: QueryQuestionsDto,
  ) {
    return this.questionsService.findTrash(userId, query);
  }

  @Post('batch-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  batchDelete(
    @CurrentUser('id') userId: string,
    @Body() dto: BatchDeleteDto,
  ) {
    return this.questionsService.batchDelete(userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.questionsService.findOne(userId, id);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(userId, dto);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.questionsService.softDelete(userId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.questionsService.updateStatus(userId, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.questionsService.duplicate(userId, id);
  }

  @Patch(':id/restore')
  restore(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.questionsService.restore(userId, id);
  }
}
