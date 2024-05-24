import { IACL } from '../../db/models/ACL.js';
import { IEntity, IModel, IRelationship, RelationshipType } from '../../db/models/Model.js';
import { IOrg } from '../../db/models/Org.js';


export class ModelIOData {
  static data(opts: { orgs: IOrg[], acls: IACL[] }): { models: IModel[], entities: IEntity[], relationships: IRelationship<RelationshipType>[] } {
    const models = ModelIOData.models(opts);
    const entities = ModelIOData.entities(models);
    const relationships = ModelIOData.directedRelationships({ models, entities });

    return { models, entities, relationships };
  }

  private static models(opts: { orgs: IOrg[], acls: IACL[] }): IModel[] {
    return [
      { modelId: 'c18e95b8-746f-4b00-b7eb-c448db0fdf52', orgId: opts.orgs[0].orgId, aclId: opts.acls[0].aclId },
      { modelId: 'f38660b7-97fd-4b54-b0e3-f280b8d0c5d9', orgId: opts.orgs[0].orgId, aclId: opts.acls[1].aclId },
      { modelId: '590970a2-209b-48f8-b774-7cd76f603efa', orgId: opts.orgs[1].orgId, aclId: opts.acls[2].aclId },
      { modelId: '40fcbca1-3508-4b10-8364-9776ab139a4b', orgId: opts.orgs[0].orgId, aclId: opts.acls[3].aclId },
      { modelId: '4e67fefd-45dd-4b68-95c6-d66be86610b3', orgId: opts.orgs[1].orgId, aclId: opts.acls[4].aclId },
    ];
  }

  private static entities(models: IModel[]): IEntity[] {
    return [
      {
        objectId: '758f531b-085d-453d-8629-a87ec5647764',
        modelId: models[0].modelId,
        label: 'org',
        sourceId: null,
        v: 0,
        metadata: {
          orgId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          name: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          industry: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          createdAt: {
            type: { primitive: 'date', array: false },
            optional: false, unique: false, identifier: 'n/a',
          }
        }
      },
      {
        objectId: '4c6d7c42-bd3e-4b13-9436-ff35e7fcc46f',
        modelId: models[0].modelId,
        label: 'factory',
        sourceId: null,
        v: 0,
        metadata: {
          factoryId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          orgId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: false, identifier: 'secondary'
          },
          productId: {
            type: { primitive: 'string', array: true },
            optional: true, unique: false, identifier: 'secondary'
          },
          createdAt: {
            type: { primitive: 'date', array: false },
            optional: false, unique: false, identifier: 'n/a',
          }
        }
      },
      {
        objectId: 'a0b1a9e1-dd1d-4eeb-b4c5-1facd2407d91',
        modelId: models[0].modelId,
        label: 'process',
        sourceId: null,
        v: 0,
        metadata: {
          processId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          label: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          orgId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'secondary'
          },
          factoryId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'secondary'
          },
          description: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          steps: {
            type: { primitive: 'string', array: true },
            optional: false, unique: true, identifier: 'n/a'
          },
          createdAt: {
            type: { primitive: 'date', array: false },
            optional: false, unique: false, identifier: 'n/a',
          }
        }
      },
      {
        objectId: 'b4bc2baf-79b1-4fb0-a8b8-0437af8b9a52',
        modelId: models[0].modelId,
        label: 'earningsReport',
        sourceId: null,
        v: 0,
        metadata: {
          earningsReportId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          orgId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'secondary'
          },
          factoryId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'secondary'
          },
          liquidity: {
            type: { primitive: 'number', array: false },
            optional: false, unique: false, identifier: 'n/a'
          },
          revenue: {
            type: { primitive: 'number', array: false },
            optional: false, unique: false, identifier: 'n/a'
          },
          growth: {
            type: { primitive: 'number', array: false },
            optional: false, unique: false, identifier: 'n/a'
          },
          earningsPerShare: {
            type: { primitive: 'number', array: false },
            optional: false, unique: false, identifier: 'n/a'
          },
          createdAt: {
            type: { primitive: 'date', array: false },
            optional: false, unique: false, identifier: 'n/a',
          }
        }
      },
      {
        objectId: '699c83b6-1d3f-4255-a754-e124e8dac6ce',
        modelId: models[0].modelId,
        label: 'product',
        sourceId: null,
        v: 0,
        metadata: {
          productId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          name: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'primary'
          },
          orgId: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'secondary'
          },
          group: {
            type: { primitive: 'string', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          manufacturingCost: {
            type: { primitive: 'number', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          retailPrice: {
            type: { primitive: 'number', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          unitsSold: {
            type: { primitive: 'number', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          targetUnitsSold: {
            type: { primitive: 'number', array: false },
            optional: false, unique: true, identifier: 'n/a'
          },
          createdAt: {
            type: { primitive: 'date', array: false },
            optional: false, unique: false, identifier: 'n/a',
          }
        }
      }
    ];
  }

  private static directedRelationships(opts: { models: IModel[], entities: IEntity[] }): IRelationship<'directed'>[] {
    return [
      {
        objectId: '1b05f66c-b087-476c-b5f6-3849af57eadd',
        modelId: opts.models[0].modelId,
        label: 'manufactures',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ opts.entities[1].objectId ],
          dests: [ opts.entities[4].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: '5ffc6af4-284c-4fd5-9b07-4f621b2ba976',
        modelId: opts.models[0].modelId,
        label: 'builds',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ opts.entities[0].objectId ],
          dests: [ opts.entities[1].objectId, opts.entities[2].objectId, opts.entities[4].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: '9499727e-7ac9-4bd0-ae71-d9355f832390',
        modelId: opts.models[0].modelId,
        label: 'audits',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ opts.entities[3].objectId ],
          dests: [ opts.entities[0].objectId, opts.entities[1].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: '0e9e0b98-84ae-44d5-a7c6-728ece9fb9ae',
        modelId: opts.models[0].modelId,
        label: 'defines',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ opts.entities[2].objectId ],
          dests: [ opts.entities[0].objectId, opts.entities[1].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: '38fd0206-a675-492c-9d27-6d5c924e296a',
        modelId: opts.models[0].modelId,
        label: 'influences',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ opts.entities[4].objectId ],
          dests: [ opts.entities[0].objectId, opts.entities[3].objectId ],
          rType: 'directed'
        }
      }
    ];
  }
}