import { FindAllResponse } from 'src/types/common.type';
import {
	FilterQuery,
	PipelineStage,
	QueryOptions,
	UpdateQuery,
} from 'mongoose';

export interface BaseRepositoryInterface<T> {
	create(dto: T | any): Promise<T>;

	insert(dtos: T[] | any[]): Promise<any>;

	findOneById(id: string, projection?: string, option?: object): Promise<T>;

	findOneByCondition(condition?: FilterQuery<T>, options?: object): Promise<T>;

	findAll(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<FindAllResponse<T>>;

	findByAggregate(pipeline: PipelineStage[]): Promise<any>;

	find(condition: FilterQuery<T>, options?: object): Promise<T[]>;

	findAllIncludeDeletedAt(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<FindAllResponse<T>>;

	update(id: string, dto: UpdateQuery<any>): Promise<T>;

	softDelete(id: string): Promise<boolean>;

	permanentlyDelete(id: string): Promise<boolean>;

	updateMany(filter: FilterQuery<T>, dto: Partial<T>): Promise<T>;

	upsertDocument(filter: FilterQuery<T>, dto: Partial<T>): Promise<T>;

	softDeleteMany(filter: FilterQuery<T>): Promise<any>;

	deleteMany(filter: FilterQuery<T>): Promise<any>;
}
