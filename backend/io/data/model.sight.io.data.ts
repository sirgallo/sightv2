import { CryptoUtil } from '../../core/utils/Crypto.js';
import { IEntity, IModel, IRelationship } from '../../db/models/Model.js';
import { AuthIOData } from './auth.sight.io.data.js';


export class ModelIOData {
  static models(): IModel[] {
    const orgs = AuthIOData.orgs();
    const acls = AuthIOData.acls();

    return [
      { modelId: CryptoUtil.generateSecureUUID(), orgId: orgs[0].orgId, aclId: acls[0].aclId },
      { modelId: CryptoUtil.generateSecureUUID(), orgId: orgs[0].orgId, aclId: acls[1].aclId },
      { modelId: CryptoUtil.generateSecureUUID(), orgId: orgs[1].orgId, aclId: acls[2].aclId },
      { modelId: CryptoUtil.generateSecureUUID(), orgId: orgs[0].orgId, aclId: acls[3].aclId },
      { modelId: CryptoUtil.generateSecureUUID(), orgId: orgs[1].orgId, aclId: acls[4].aclId },
    ];
  }

  static entities(): IEntity[] {
    const models = ModelIOData.models();
    return [
      {
        objectId: CryptoUtil.generateSecureUUID(),
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
        objectId: CryptoUtil.generateSecureUUID(),
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
        objectId: CryptoUtil.generateSecureUUID(),
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
        objectId: CryptoUtil.generateSecureUUID(),
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
        objectId: CryptoUtil.generateSecureUUID(),
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

  static directedRelationships(): IRelationship<'directed'>[] {
    const models = ModelIOData.models();
    const entities = ModelIOData.entities();

    return [
      {
        objectId: CryptoUtil.generateSecureUUID(),
        modelId: models[0].modelId,
        label: 'manufactures',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ entities[1].objectId ],
          dests: [ entities[4].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: CryptoUtil.generateSecureUUID(),
        modelId: models[0].modelId,
        label: 'builds',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ entities[0].objectId ],
          dests: [ entities[1].objectId, entities[2].objectId, entities[4].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: CryptoUtil.generateSecureUUID(),
        modelId: models[0].modelId,
        label: 'audits',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ entities[3].objectId ],
          dests: [ entities[0].objectId, entities[1].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: CryptoUtil.generateSecureUUID(),
        modelId: models[0].modelId,
        label: 'defines',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ entities[2].objectId ],
          dests: [ entities[0].objectId, entities[1].objectId ],
          rType: 'directed'
        }
      },
      {
        objectId: CryptoUtil.generateSecureUUID(),
        modelId: models[0].modelId,
        label: 'influences',
        sourceId: null,
        v: 0,
        metadata: {
          sources: [ entities[4].objectId ],
          dests: [ entities[0].objectId, entities[3].objectId ],
          rType: 'directed'
        }
      }
    ];
  }
}