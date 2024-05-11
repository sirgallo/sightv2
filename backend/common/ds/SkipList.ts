class SkipListNode<T> { // a node in a skip list, representing an individual entry
  value: T;  // the value stored in this node.
  forwards: Array<SkipListNode<T>>;  // pointers to next nodes at different levels.

  constructor(value: T, level: number) {
    this.value = value;  // initializes the node's value.
    this.forwards = new Array(level + 1).fill(null);  // initialize forward pointers to null.
  }
}

export class SkipList<T> { // skip list implementation for fast put, get, and delete operations
  header: SkipListNode<T>; // the header node of the skip list

  constructor(
    private level: number = 0, // current highest level of the skip list
    private readonly maxLevel: number = 16, // max level a node can have
    private readonly probability: number = 0.5 // probability factor for determining levels of nodes
  ) { this.header = new SkipListNode<T>(null, maxLevel); } // initialize the header with maximum level

  put(value: T) { // put a new value into the skip list
    let update = Array<SkipListNode<T>>(this.maxLevel + 1).fill(this.header);
    let currentNode = this.header;

    for (let currLvl = this.level; currLvl >= 0; currLvl--) { // locate the position for the new value across levels.
      while (currentNode.forwards[currLvl] !== null && currentNode.forwards[currLvl].value < value) { currentNode = currentNode.forwards[currLvl]; }
      update[currLvl] = currentNode;
    }

    currentNode = currentNode.forwards[0];
    if (currentNode === null || currentNode.value !== value) {
      let newLevel = this.generateRandomLevel();
      if (newLevel > this.level) {
        for (let currLvl = this.level + 1; currLvl <= newLevel; currLvl++) { update[currLvl] = this.header; }
        this.level = newLevel;
      }

      let newNode = new SkipListNode(value, newLevel);
      for (let currLvl = 0; currLvl <= newLevel; currLvl++) {
        newNode.forwards[currLvl] = update[currLvl].forwards[currLvl];
        update[currLvl].forwards[currLvl] = newNode;
      }
    }
  }

  get(value: T): boolean { // get a value from the skip list to check if it exists
    let currentNode = this.header;
    for (let currLvl = this.level; currLvl >= 0; currLvl--) {
      while (currentNode.forwards[currLvl] !== null && currentNode.forwards[currLvl].value < value) { currentNode = currentNode.forwards[currLvl]; }
    }

    currentNode = currentNode.forwards[0];
    return currentNode !== null && currentNode.value === value;
  }

  del(value: T) { // deletes a value from the skip list
    let update = Array(this.maxLevel + 1).fill(null);
    let currentNode = this.header;

    for (let currLvl = this.level; currLvl >= 0; currLvl--) {
      while (currentNode.forwards[currLvl] !== null && currentNode.forwards[currLvl].value < value) { currentNode = currentNode.forwards[currLvl]; }
      update[currLvl] = currentNode;
    }

    currentNode = currentNode.forwards[0];
    if (currentNode !== null && currentNode.value === value) {
      for (let currLvl = 0; currLvl <= this.level; currLvl++) {
        if (update[currLvl].forwards[currLvl] !== currentNode) break;
        update[currLvl].forwards[currLvl] = currentNode.forwards[currLvl];
      }

      while (this.level > 0 && this.header.forwards[this.level] === null) { this.level--; } // decrease the level of the skip list if the highest levels are empty.
    }
  }

  private generateRandomLevel = (): number => { // randomly determines the level for a new node
    let lvl = 0;
    while (Math.random() < this.probability && lvl < this.maxLevel) { lvl++; }
    return lvl;
  }
}