import { BaseEntity } from '@modules/shared/base/base.entity';
import { BaseRepositoryInterface } from '@repositories/base/base.interface.repository';
import { FindAllResponse } from 'src/types/common.type';
import { BaseServiceInterface } from './base.interface.service';
import { FilterQuery, UpdateQuery } from 'mongoose';

export abstract class BaseServiceAbstract<T extends BaseEntity>
	implements BaseServiceInterface<T>
{
	constructor(private readonly repository: BaseRepositoryInterface<T>) {}

	async create(create_dto: T | any): Promise<T> {
		return await this.repository.create(create_dto);
	}

	async findAll(
		filter?: object,
		options?: object,
	): Promise<FindAllResponse<T>> {
		return await this.repository.findAll(filter, options);
	}

	async find(filter?: FilterQuery<T>, options?: object): Promise<T[]> {
		return await this.repository.find(filter, options);
	}

	async findOne(id: string, projection?: string) {
		return await this.repository.findOneById(id, projection);
	}

	async findOneByCondition(filter: object, options?: object) {
		return await this.repository.findOneByCondition(filter, options);
	}

	//PipelineStage
	async findByAggregate(pipeline: any[]): Promise<any> {
		return this.repository.findByAggregate(pipeline);
	}

	async update(id: string, updateDto: UpdateQuery<any>) {
		return await this.repository.update(id, updateDto);
	}

	async upsertDocument(filter: object, updateDto: Partial<T>) {
		return await this.repository.upsertDocument(filter, updateDto);
	}

	async remove(id: string) {
		return await this.repository.softDelete(id);
	}

	async updateMany(filter: FilterQuery<T>, dto: Partial<T>) {
		return await this.repository.updateMany(filter, dto);
	}

	async removeMany(ids: string[]) {
		return await this.repository.softDeleteMany({
			_id: {
				$in: ids,
			},
		});
	}
}
