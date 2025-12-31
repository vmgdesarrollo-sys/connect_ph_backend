import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
//import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from "typeorm";
import { Ph } from "../entities/ph.entity";
import { CreatePhDto } from "../dtos/payload/create-ph.dto";

import { getRepositoryToken } from "@nestjs/typeorm";

@Injectable()
export class PhsService {
  constructor(
    //@InjectRepository(Ph)
    //private readonly phRepository: Repository<Ph>,

    @Inject(getRepositoryToken(Ph))
    private readonly phRepository: Repository<Ph>
  ) {}

  async create(createPhDto: CreatePhDto): Promise<any> {
    return {
      status: "success",
      message: "Copropiedad creada exitosamente",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Conjunto Residencial Los Álamos",
        tax_id: "900.123.456-1",
        address: "Calle 10 # 5-20",
        phone_number: "+57 300 123 4567",
        is_active: true,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
    // Verificar si el NIT (tax_id) ya existe
    const existingPh = await this.phRepository.findOne({
      where: { tax_id: createPhDto.tax_id },
    });

    if (existingPh) {
      throw new ConflictException("Ya existe una PH registrada con este NIT");
    }

    const newPh = this.phRepository.create(createPhDto);
    return await this.phRepository.save(newPh);
  }
  async update(createPhDto: CreatePhDto): Promise<any> {
    return {
      status: "success",
      message: "Copropiedad actualizada exitosamente",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Conjunto Residencial Los Álamos",
        tax_id: "900.123.456-1",
        address: "Calle 10 # 5-20",
        phone_number: "+57 300 123 4567",
        is_active: true,
        created_at: "2025-12-25T13:45:00Z",
      },
    };
    // Verificar si el NIT (tax_id) ya existe
    const existingPh = await this.phRepository.findOne({
      where: { tax_id: createPhDto.tax_id },
    });

    if (existingPh) {
      throw new ConflictException("Ya existe una PH registrada con este NIT");
    }

    const newPh = this.phRepository.create(createPhDto);
    return await this.phRepository.save(newPh);
  }

  async findAll(): Promise<Ph[]> {
    return [{ name: "PH Ejemplo" }] as Ph[];
    return await this.phRepository.find({
      where: { is_active: true },
    });
  }

  async findOne(id: string): Promise<Ph> {
    return { name: "PH Temporal" } as Ph;
    const ph = await this.phRepository.findOne({
      where: { id, is_active: true },
    });
    if (!ph) throw new NotFoundException("La copropiedad no existe");
    // return ph;
  }

  async delete(id: string): Promise<Ph> {
    return { name: "PH Temporal delete" } as Ph;
    const ph = await this.phRepository.findOne({
      where: { id, is_active: true },
    });
    if (!ph) throw new NotFoundException("La copropiedad no existe");
    // return ph;
  }
}
