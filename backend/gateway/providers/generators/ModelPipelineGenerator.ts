import { FilterQuery, PipelineStage } from 'mongoose';

import { IModel, RelationshipType } from '../../../db/models/Model.js';
import { ModelRequest } from '../../types/Model.js';



export class ModelAggregateGenerator {
  static aggregate = <T extends RelationshipType>(opts: ModelRequest<'view', T>): PipelineStage[] => {
    return [
      ModelAggregateGenerator.modelFilter(opts),
      ModelAggregateGenerator.entityLookup(),
      ModelAggregateGenerator.relationshipLookup(),
      ...ModelAggregateGenerator.aclLookup(),
      ModelAggregateGenerator.modelProjection()
    ]
  };

  private static modelFilter = <T extends RelationshipType>(opts: ModelRequest<'view', T>): PipelineStage.Match => {
    const filterQuery: FilterQuery<IModel> = { modelId: opts.modelId };
    return { $match: filterQuery };
  }

  private static entityLookup = (): PipelineStage.Lookup => {
    return {
      $lookup: {
        from: 'entities',
        localField: 'modelId',
        foreignField: 'modelId',
        as: 'entities'
      }
    };
  };

  private static relationshipLookup = (): PipelineStage.Lookup => {
    return {
      $lookup: {
        from: 'relationships',
        localField: 'modelId',
        foreignField: 'modelId',
        as: 'relationships'
      }
    }
  };

  private static aclLookup = (): PipelineStage[] => {
    return [
      {
        $lookup: {
          from: 'acl',
          localField: 'aclId',
          foreignField: 'aclId',
          as: 'acl'
        }
      },
      { $unwind: { path: 'acl', preserveNullAndEmptyArrays: true } }
    ];
  };

  private static modelProjection = (): PipelineStage.Project => {
    return {
      $project: {
        _id: 0, modelId: 1, orgId: 1, createdAt: 1, updatedAt: 1, 
        acl: 1, entities: 1, relationships: 1
      }
    }
  };
}