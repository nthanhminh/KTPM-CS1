import { BaseEntity } from '@modules/shared/base/base.entity';
import {
	ClientSession,
	Connection,
	FilterQuery,
	Model,
	PipelineStage,
	QueryOptions,
	SaveOptions,
} from 'mongoose';
import { FindAllResponse } from 'src/types/common.type';
import { BaseRepositoryInterface } from './base.interface.repository';

export abstract class BaseRepositoryAbstract<T extends BaseEntity>
	implements BaseRepositoryInterface<T>
{
	protected constructor(
		private readonly model: Model<T>,
		private readonly connection: Connection,
	) {
		this.model = model;
	}

	async create(dto: T | any, options?: SaveOptions): Promise<T> {
		return this.model.create(dto);
	}

	async insert(dtos: T[] | any[]): Promise<any> {
		return this.model.insertMany(dtos);
	}

	async findOneById(
		id: string,
		projection?: string,
		options?: QueryOptions<T>,
	): Promise<T> {
		const item = await this.model.findById(id, projection, options);
		return item?.deletedAt ? null : item.toObject();
	}

	async findOneByCondition(
		condition = {},
		options?: QueryOptions<T>,
	): Promise<T> {
		return await this.model
			.findOne(
				{
					...condition,
					deletedAt: null,
				},
				options?.projection,
				options,
			)
			.exec();
	}

	async findAll(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<FindAllResponse<T>> {
		const [count, items] = await Promise.all([
			this.model.countDocuments({ ...condition, deletedAt: null }),
			this.find({ ...condition, deletedAt: null }, options),
		]);
		return {
			count,
			items,
		};
	}

	async find(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<T[]> {
		return this.model.find(condition, options?.projection, options);
	}

	async findAllIncludeDeletedAt(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<FindAllResponse<T>> {
		const [count, items] = await Promise.all([
			this.model.countDocuments({ ...condition }),
			this.model.find(condition, options?.projection, options),
		]);
		return {
			count,
			items,
		};
	}

	//PipelineStage
	async findByAggregate(pipeline: PipelineStage[]): Promise<any> {
		return this.model.aggregate(pipeline);
	}

	async update(id: string, dto: Partial<T>): Promise<T> {
		return await this.model.findOneAndUpdate(
			{ _id: id, deletedAt: null },
			dto,
			{ new: true },
		);
	}

	async softDelete(id: string): Promise<boolean> {
		const delete_item = await this.model.findById(id);
		if (!delete_item) {
			return false;
		}

		return !!(await this.model
			.findByIdAndUpdate<T>(id, { deletedAt: new Date() })
			.exec());
	}

	async permanentlyDelete(id: string): Promise<boolean> {
		const delete_item = await this.model.findById(id);
		if (!delete_item) {
			return false;
		}
		return !!(await this.model.findOneAndDelete({ _id: id }));
	}

	async updateMany(filter: FilterQuery<T>, dto: Partial<T>): Promise<any> {
		return this.model.updateMany(
			{
				...filter,
				deletedAt: null,
			},
			dto,
		);
	}

	async upsertDocument(filter: any, update: any): Promise<any> {
		const options = { upsert: true, new: true, setDefaultsOnInsert: true };
		return this.model.findOneAndUpdate(filter, update, options).exec();
	}

	async softDeleteMany(filter: FilterQuery<T>): Promise<any> {
		return this.model.updateMany(
			{
				...filter,
				deletedAt: null,
			},
			{
				deletedAt: new Date(),
			},
		);
	}

	async deleteMany(filter: FilterQuery<T>): Promise<any> {
		return this.model.deleteMany({
			...filter,
		});
	}

	async startTransaction(): Promise<ClientSession> {
		const session = await this.connection.startSession();
		session.startTransaction();
		return session;
	}
}
