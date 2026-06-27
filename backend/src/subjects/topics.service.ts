import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../topics/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async findAllBySubject(subjectId: string): Promise<Topic[]> {
    return this.topicRepository.find({
      where: { subjectId },
      order: { name: 'ASC' },
    });
  }

  async findAll(): Promise<Topic[]> {
    return this.topicRepository.find({
      relations: { subject: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: { subject: true },
    });
    if (!topic) throw new NotFoundException('Tópico não encontrado');
    return topic;
  }

  async create(userId: string, subjectId: string, dto: CreateTopicDto): Promise<Topic> {
    const topic = this.topicRepository.create({ ...dto, subjectId, userId });
    return this.topicRepository.save(topic);
  }

  async update(id: string, dto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.findOne(id);
    Object.assign(topic, dto);
    return this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<void> {
    const topic = await this.findOne(id);
    await this.topicRepository.remove(topic);
  }
}
