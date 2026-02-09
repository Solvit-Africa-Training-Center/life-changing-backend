import { Injectable } from '@nestjs/common';
import {
  Repository,
  FindOptionsOrder,
  DeepPartial,
  QueryDeepPartialEntity,
  FindOptionsWhere,
} from 'typeorm';
import { PaginationParams, PaginatedResponse } from '../interfaces/pagination.interface';
import { BaseEntity } from '../interfaces/base.entity.interface';

@Injectable()
export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async paginate(
    params: PaginationParams,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    relations?: string[],
  ): Promise<PaginatedResponse<T>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = (params.sortBy || 'createdAt') as keyof T;
    const sortOrder = params.sortOrder || 'DESC';

    const order: FindOptionsOrder<T> = {
      [sortBy]: sortOrder,
    } as FindOptionsOrder<T>;

    const [data, total] = await this.repository.findAndCount({
      where,
      relations,
      order,
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, relations?: string[]): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: QueryDeepPartialEntity<T>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<number> {
    return this.repository.count({ where });
  }

  async findAll(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    relations?: string[],
    order?: FindOptionsOrder<T>,
  ): Promise<T[]> {
    return this.repository.find({
      where,
      relations,
      order,
    });
  }

   async exists(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
