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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.subjectsService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.subjectsService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.subjectsService.remove(id, userId);
  }
}
