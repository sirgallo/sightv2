import { SightMongoProvider } from '../../db/SightProvider.js';


export class TaskProvider {
  constructor(private sightDb: SightMongoProvider) {}
}