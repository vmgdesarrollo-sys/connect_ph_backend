import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PhsService } from '../services/phs.service';
import { CreatePhDto } from '../dtos/create-ph.dto';

@Controller('phs')
export class PhsController {
  constructor(private readonly phsService: PhsService) {}

  @Post()
  async create(@Body() createPhDto: CreatePhDto) {
    return await this.phsService.create(createPhDto);
  }

  @Get()
  async findAll() {
    return await this.phsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.phsService.findOne(id);
  }
}