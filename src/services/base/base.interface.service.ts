import { FindAllResponse } from 'src/types/common.type';
import { FilterQuery, PipelineStage } from 'mongoose';

export interface Write<T> {
	create(item: T | any): Promise<T>;
	update(id: string, item: Partial<T>): Promise<T>;
	upsertDocument(id: object, item: Partial<T>): Promise<T>;
	remove(id: string): Promise<boolean>;
	updateMany(filter: FilterQuery<T>, dto: Partial<T>);
	removeMany(ids: string[]);
}

export interface Read<T> {
	findAll(filter?: object, options?: object): Promise<FindAllResponse<T>>;
	find(filter?: object, options?: object): Promise<T[]>;
	findOne(id: string): Promise<T>;
	findOneByCondition(filter: Partial<T>, options?: object): Promise<T>;
	findByAggregate(pipeline: PipelineStage[]): Promise<T>;
}

export interface BaseServiceInterface<T> extends Write<T>, Read<T> {}
