import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { LessonsService } from './lessons.service';
import { GenerateLessonDto } from './dto/generate-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('generate')
  async generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateLessonDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.lessonsService.generate(userId, dto)) {
        res.write(`data: ${chunk}\n\n`);
      }
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
