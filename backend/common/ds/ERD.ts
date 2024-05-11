import { SkipList } from './SkipList';


//======================== ERD: Relationship

type RelationshipType = 'directed' | 'undirected';
interface __relationship {
  rId: string;
  modelId: string;
  label: string;
  v: number; // version tag
}

interface __undirectedRelationship {
  members: { [entityId: string]: string };
}

interface __directedRelationship {
  sources: { [entityId: string]: string };
  dests: { [entityId: string]: string };
}

export type Relationship<T extends RelationshipType> = 
  T extends 'directed' 
  ? __relationship & __directedRelationship
  : T extends 'undirected'
  ? __relationship & __undirectedRelationship
  : never;

type Relationships<T extends RelationshipType> = Map<string, Relationship<T>>;


//======================== ERD: Entity

type PropIdPriorityType = 'primary' | 'secondary' | 'n/a';
type EntityProps = { 
  [prop: string]: { 
    type: string;
    optional?: boolean; // default false
    unique?: boolean; // default false
    identifier?: PropIdPriorityType; // default n/a
  }
};

export interface Entity<T extends RelationshipType> {
  entityId: string;
  modelId: string;
  classifier: string;
  props: EntityProps;
  relationships: Relationships<T>;
  description?: Map<string, string>;
  v: number; // version tag
}


//======================== ERD: Entity Relation Diagram

export class ERD<T extends RelationshipType> {
  constructor(
    private entities: Map<string, Entity<T>> = new Map(),
    private classifierIndex: Map<string, SkipList<Entity<T>>> = new Map()
  ) {}

  addEntity(
    opts: {
      entityId: string, 
      modelId: string
      classifier: string,
      props: EntityProps, 
      relationships?: { [name: string]: Relationship<T> }, 
      description?: { [descriptor: string]: string }
    }
  ) {
    const existingEntity = this.entities.get(opts.entityId);
    if (! existingEntity) {
      this.entities.set(
        opts.entityId,
        { 
          ...opts,
          props: this.propsValidator(opts.props), 
          relationships: new Map(Object.entries(opts.relationships)), 
          description: new Map(Object.entries(opts.description)),
          v: 0
        }
      );
    } else {
      const nextV = existingEntity.v + 1
      this.entities.set(
        opts.entityId,
        { 
          ...opts,
          props: this.propsValidator(opts.props), 
          relationships: new Map(Object.entries(opts.relationships)), 
          description: new Map(Object.entries(opts.description)),
          v: nextV // increment version on updates
        }
      )
    }

    const updatedEntity = this.entities.get(opts.entityId);
    this.updateClassifierIndex(opts.classifier, updatedEntity)
  }

  private updateClassifierIndex(classifier: string, entity: Entity<T>) {
    const index = (() => {
      const existingIndex = this.classifierIndex.get(classifier);
      if (! existingIndex) return new SkipList<Entity<T>>();
      return existingIndex;
    })();

    index.put(entity);
    this.classifierIndex.set(classifier, index);
  }
  
  findByClassifier(classifier: string): Entity<T>[] {
    const index = this.classifierIndex.get(classifier);
    if (! index) return [];

    return ((): Entity<T>[] => {
      let results = [];
      let currentNode = index.header.forwards[0]; // start with the lowest level head
      while (currentNode !== null) { 
        results.push(currentNode.value); 
        currentNode = currentNode.forwards[0]; // move to the next node at the lowest level
      }
      
      return results;
    })();
  }

  private propsValidator = (props?: EntityProps): EntityProps => {
    if (! props) return {};
    return Object.entries(props).reduce((acc, [key, prop]) => {
      acc[key] = { type: prop.type, optional: prop?.optional ?? false, unique: prop?.unique ?? false, identifier: prop?.identifier ?? 'n/a' };
      return acc;
    }, {} as EntityProps);
  }
}