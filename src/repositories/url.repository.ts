
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { Url, UrlDocument } from '@modules/shorten/entity/url.entity';
import { UrlRepositoryInterface } from '@modules/shorten/interface/url.interface';

@Injectable()
export class UrlRepository
  extends BaseRepositoryAbstract<UrlDocument>
  implements UrlRepositoryInterface
{
  constructor(
    @InjectModel(Url.name)
    private readonly url_model: Model<UrlDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(url_model, connection);
  }
}
