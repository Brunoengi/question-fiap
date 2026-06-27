import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SaveQuestionDto } from './dto/save-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.chatService.createSession(userId, dto);
  }

  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.chatService.getSessions(userId);
  }

  @Get('sessions/:id')
  getSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.getSession(id, userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.chatService.deleteSession(id, userId);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      let fullContent = '';
      for await (const token of this.chatService.sendMessage(id, userId, dto.content)) {
        fullContent += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }

      const questionData = this.extractJson(fullContent);
      const finalEvent = questionData
        ? { done: true, questionData }
        : { done: true, content: fullContent };

      res.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('questions')
  async saveQuestion(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveQuestionDto,
  ) {
    return this.chatService.saveQuestion({
      questionData: { ...dto.questionData, userId },
    });
  }

  private extractJson(content: string): Record<string, any> | null {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
