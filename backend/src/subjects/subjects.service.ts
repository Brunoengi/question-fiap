import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async findAll(userId: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { userId },
      relations: { topics: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id, userId },
      relations: { topics: true },
    });
    if (!subject) throw new NotFoundException('Disciplina não encontrada');
    return subject;
  }

  async create(userId: string, dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepository.create({ ...dto, userId });
    return this.subjectRepository.save(subject);
  }

  async update(id: string, userId: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id, userId);
    Object.assign(subject, dto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: string, userId: string): Promise<void> {
    const subject = await this.findOne(id, userId);
    if (subject.topics?.length) {
      throw new NotFoundException(
        'Disciplina possui tópicos associados. Remova os tópicos antes de excluir a disciplina.',
      );
    }
    await this.subjectRepository.remove(subject);
  }
}
