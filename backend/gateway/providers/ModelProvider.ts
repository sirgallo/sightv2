import lodash from 'lodash';
const { first } = lodash;

import { SightMongoProvider } from '../../db/SightProvider.js';
import { ModelEndpoints, ModelRequest, ModelResponse } from '../types/Model.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { IEntity, IModel, IRelationship, RelationshipType } from 'db/models/Model.js';
import { CryptoUtil } from 'core/utils/Crypto.js';
import { FilterQuery, PipelineStage } from 'mongoose';


export class ModelProvider implements ModelEndpoints {
  private zLog = new LogProvider(ModelProvider.name);
  constructor(private sightDb: SightMongoProvider) {}

  async generate<T extends RelationshipType>(opts: ModelRequest<'generate', T>): Promise<ModelResponse<'generate', T>> {
    try {
      let resp: ModelResponse<'generate', T>;
      const session = await this.sightDb.conn.startSession();
      session.startTransaction();

      const model = await this.insertModel(opts.model);
      if (model) {
        const [ entities, relationships ] = await Promise.all([
          this.insertEntities(model, opts.entities),
          this.insertRelationships(model, opts.relationships)
        ]);

        resp = { ...model, entities, relationships };
      } else { throw new Error('error inserting model metadata into model collection'); }
      
      await session.commitTransaction();
      return resp;
    } catch (err) {
      this.zLog.error(`generation error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  async view<T extends RelationshipType>(opts: ModelRequest<'view', T>): Promise<ModelResponse<'view', T>> {
    try {
      const pipeline = ModelAggregateGenerator.aggregate(opts);
      const resp: ModelResponse<'view', T> = first(await this.sightDb.model.aggregate(pipeline));

      return resp;
    } catch (err) {
      this.zLog.error(`view error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  async update<T extends RelationshipType>(opts: ModelRequest<'update', T>): Promise<ModelResponse<'update', T>> {
    try {
      const session = await this.sightDb.conn.startSession();
      session.startTransaction();
      
      const removeHelper = async () => {
        const removed: { entities: number, relationships: number } = { entities: 0, relationships: 0 };
        if (opts.updatePayload.remove.entities?.length > 0) { 
          const ack = await this.sightDb.entity.deleteMany({
            objectId: { $in: opts.updatePayload.remove.entities.map(e => e.objectId) }
          }) ;

          removed.entities = ack.deletedCount;
        }

        if (opts.updatePayload.remove.relationships?.length > 0) {
          const ack = await this.sightDb.relationship.deleteMany({
            objectId: { $in: opts.updatePayload.remove.relationships.map(e => e.objectId) }
          });

          removed.relationships = ack.deletedCount;
        }

        return removed;
      };

      const addHelper = async () => {
        const added: { entities: IEntity[], relationships: IRelationship<T>[] } = { entities: [], relationships: [] };
        if (opts.updatePayload.add.entities?.length > 0) {
          added.entities = await this.sightDb.entity.insertMany(opts.updatePayload.add.entities);
        }

        if (opts.updatePayload.add.relationships?.length > 0) {
          await this.sightDb.relationship.insertMany(opts.updatePayload.add.relationships);
          const inserted: IRelationship<T>[] = await this.sightDb.relationship.find({ 
            label: { $in: opts.updatePayload.add.relationships.map(r => r.label) }
          });

          added.relationships = inserted;
        }

        return added;
      };

      const updateHelper = async () => {
        const updated: { entities: IEntity[], relationships: IRelationship<T>[] } = { entities: [], relationships: [] };
        for (const entity of opts.updatePayload.update.entities) {
          const updateEntity: IEntity = await this.sightDb.entity.findOneAndUpdate(
            { objectId: entity.objectId },
            { $set: entity },
            { new: true }
          );

          updated.entities.push(updateEntity)
        }

        for (const relationship of opts.updatePayload.update.relationships) {
          const updatedRelationship: IRelationship<T> = await this.sightDb.relationship.findOneAndUpdate(
            { objectId: relationship.objectId },
            { $set: relationship },
            { new: true }
          );

          updated.relationships.push(updatedRelationship);
        }

        return updated;
      };

      const model = await this.sightDb.model.findOne({ modelId: opts.model.modelId });

      await removeHelper();
      await addHelper();
      await updateHelper();

      const view = await this.view({ modelId: model.modelId });
      await session.commitTransaction();

      return { ...model, entities: view.entities, relationships: view.relationships as IRelationship<T>[] };
    } catch (err) {
      this.zLog.error(`update error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  async delete<T extends RelationshipType>(opts: ModelRequest<'delete', T>): Promise<ModelResponse<'delete', T>> {
    try {
      const session = await this.sightDb.conn.startSession();
      session.startTransaction();
      
      const [ model, entity, relationship ] = await Promise.all([
        this.sightDb.model.deleteOne(opts),
        this.sightDb.entity.deleteMany(opts),
        this.sightDb.relationship.deleteMany(opts)
      ]);

      await session.commitTransaction();
      
      return { modelId: opts.modelId, count: { entity: entity.deletedCount, relationship: relationship.deletedCount } };
    } catch (err) {
      this.zLog.error(`delete error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async insertEntities<T extends RelationshipType>(
    model: IModel, 
    entities: ModelRequest<'generate', T>['entities']
  ): Promise<IEntity[]> {
    const validatedEntries = entities.map(e => { 
      return { modelId: model.modelId, objectId: CryptoUtil.generateSecureUUID(), v: 0, ...e };
    });

    const inserted: IEntity[] = await this.sightDb.entity.insertMany(validatedEntries);
    return inserted;
  }

  private async insertRelationships<T extends RelationshipType>(
    model: IModel, 
    relationships: ModelRequest<'generate', T>['relationships']
  ): Promise<IRelationship<T>[]> {
    const validatedEntries: IRelationship<T>[] = relationships.map(r => {
      return { modelId: model.modelId, objectId: CryptoUtil.generateSecureUUID(), v: 0, ...r };
    });

    await this.sightDb.relationship.insertMany(validatedEntries);
    return this.sightDb.relationship.find({ modelId: model.modelId });
  }

  private async insertModel<T extends RelationshipType>(opts: ModelRequest<'generate', T>['model']): Promise<IModel> {
    const validatedModel: IModel = { modelId: CryptoUtil.generateSecureUUID(), ...opts };
    return first(await this.sightDb.model.insertMany([ validatedModel ]));
  }
}


class ModelAggregateGenerator {
  static aggregate = <T extends RelationshipType>(opts: ModelRequest<'view', T>): PipelineStage[] => {
    const modelFilter: FilterQuery<IModel> = { modelId: opts.modelId };
    return [
      { $match: modelFilter },
      {
        $lookup: {
          from: 'entities',
          localField: 'modelId',
          foreignField: 'modelId',
          as: 'entities'
        }
      },
      {
        $lookup: {
          from: 'relationships',
          localField: 'modelId',
          foreignField: 'modelId',
          as: 'relationships'
        }
      }
    ]
  }
}