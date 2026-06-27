import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AutoSelectDto } from './dto/auto-select.dto';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.examsService.findAll(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExamDto,
  ) {
    return this.examsService.create(userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.examsService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.examsService.remove(id, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.examsService.updateStatus(id, userId, dto);
  }

  @Post('auto-select')
  autoSelect(@Body() dto: AutoSelectDto) {
    return this.examsService.autoSelect(dto);
  }

  @Put(':id/questions')
  updateQuestions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionsDto,
  ) {
    return this.examsService.updateQuestions(id, userId, dto);
  }

  @Put(':id/questions/order')
  reorderQuestions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.examsService.reorderQuestions(id, userId, dto);
  }
}
