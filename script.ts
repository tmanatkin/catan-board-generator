// TODO
// no resource tiles too close to their matching port

// no two of (same number)/(six or eight) next to each other
// no (same number)/(six or eight) on the same resource

type Resource = "wood" | "wheat" | "sheep" | "brick" | "ore" | "desert";

interface UncollapsedTile {
  value: null;
  options: Resource[];
}

interface CollapsedTile {
  value: Resource;
  options: null;
}

type Tile = UncollapsedTile | CollapsedTile;

type Coordinate = [number, number];

type CoordinateKey = `${number},${number}`;

type Board = { [key: CoordinateKey]: Tile };

type ResourceCounts = { [key in Resource]: number };

interface BoardGenerationResult {
  board: Board;
  complete: boolean;
}

type PropagationRule = (b: Board, c: CoordinateKey, r: Resource) => boolean;

const RESOURCE_OPTIONS: Resource[] = ["wood", "wheat", "sheep", "brick", "ore", "desert"];

const NEIGHBOR_COORDINATES: Coordinate[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

let resourceCounts: ResourceCounts = {
  wood: 4,
  wheat: 4,
  sheep: 4,
  brick: 3,
  ore: 3,
  desert: 1,
};

// convert coordinate to object key
function coordKey([q, r]: Coordinate): CoordinateKey {
  return `${q},${r}`;
}

// convert object key to coordinate
function keyCoord(key: CoordinateKey): Coordinate {
  return key.split(",").map(Number) as Coordinate;
}

// generate hexagonal shaped board based on radius
function generateHexBoard(radius: number): Board {
  const board: Board = {};

  // iterate through all possible q and r values within radius
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      // s = -q - r; filter if outside hex radius bounds
      if (Math.abs(-q - r) > radius) {
        continue;
      }

      // create starting entries for each board space
      board[coordKey([q, r])] = {
        options: [...RESOURCE_OPTIONS],
        value: null,
      };
    }
  }

  // return generated board
  return board;
}

// get neighbors for current tile
function getNeighbors(board: Board, [q, r]: Coordinate): CoordinateKey[] {
  const keys: CoordinateKey[] = [];

  // for every set of neighbor coordinates
  for (const [dq, dr] of NEIGHBOR_COORDINATES) {
    // find neighbor tile to current coordinates
    const key = coordKey([q + dq, r + dr]);

    // if a tile exists
    if (board[key]) {
      keys.push(key);
    }
  }

  return keys;
}

// choose resource option to collapse to, weighted on the available count
function chooseWeightedResource(tile: UncollapsedTile, resourceTileCounts: ResourceCounts): Resource {
  let optionWeights: ResourceCounts = {} as ResourceCounts;
  let runningTotal = 0;

  // add to running total for number of each available resource
  for (const option of tile.options) {
    runningTotal += resourceTileCounts[option];
    optionWeights[option] = runningTotal;
  }

  // pick a random number along the possible scale
  let choice = Math.random() * runningTotal;

  // iterate through possible resources and find choice based on set scale
  for (const resource of tile.options) {
    if (choice <= optionWeights[resource]) {
      return resource;
    }
  }

  throw new Error(
    `chooseWeightedResource: no resource selected choice=${choice}, runningTotal=${runningTotal}, options=${tile.options}`
  );
}

// selects tile with lowest entropy (least amount of choice), if entropy is equal randomly choose
function findLowestEntropyTile(board: Board): CoordinateKey | null {
  let lowestEntropy = Infinity;
  let candidates: CoordinateKey[] = [];

  for (const [rawKey, tile] of Object.entries(board)) {
    const key = rawKey as CoordinateKey;

    // skip tiles that have already been assigned a value
    if (tile.value !== null) continue;

    // if lowest entropy found, set as candidate
    if (tile.options.length < lowestEntropy) {
      lowestEntropy = tile.options.length;
      candidates = [key];
    }
    // if another lowest entropy candidate found, save it
    else if (tile.options.length === lowestEntropy) {
      candidates.push(key);
    }
  }

  // return null if no candidates are found (board is fully collapsed)
  if (candidates.length === 0) {
    return null;
  }
  // return only candidate if only one exists
  else if (candidates.length === 1) {
    return candidates[0];
  }

  // randomly select from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// tiles cannot be assigned the same resource as their neighbor
function noSameResourceAdjacent(board: Board, key: CoordinateKey, resource: Resource): boolean {
  for (const nKey of getNeighbors(board, keyCoord(key))) {
    // skip assigned value tiles
    if (board[nKey].value !== null) {
      continue;
    }
    board[nKey].options = board[nKey].options.filter((option) => option !== resource);
  }

  return true; // propagation rule succeeded (no fail states exist for this one)
}

// tiles are limited to sharing the same resource as their neighbor
// brick and ore cannot neighbor the same resource
// wood, wheat, and sheep cannot have more than 2 neighbors of the same resource
function limitedSameResourceAdjacent(board: Board, key: CoordinateKey, resource: Resource): boolean {
  // fallback to no same resource adjacent rule if brick or ore
  if (resource === "brick" || resource === "ore") {
    return noSameResourceAdjacent(board, key, resource);
  }

  let matchingNeighbors: CoordinateKey[] = [];

  // limit to 2 touching same resources for wood, wheat, sheep
  for (const nKey of getNeighbors(board, keyCoord(key))) {
    // if neighbor has a resource match, count it
    if (board[nKey].value === resource) {
      matchingNeighbors.push(nKey);
    }
  }

  // if placing this tile creates a cluster of two, remove options from cluster neighbors
  if (matchingNeighbors.length === 1) {
    const tPropSucc = noSameResourceAdjacent(board, key, resource);
    const nPropSucc = noSameResourceAdjacent(board, matchingNeighbors[0], resource);
    return tPropSucc && nPropSucc;
  }
  // if placing this tile would create a cluster larger than 2, rerun placement
  // this is the lazy way, we could rewrite a lot of logic but this is a niche case where it would be easier to just restart
  else if (matchingNeighbors.length >= 2) {
    return false; // propagation did not pass, retry board
  }

  // if no matching neighbors found, continue as normal
  return true;
}

// using wave function collapse, generate resources for a given board
function generateBoardResources(
  board: Board,
  resourceTileCounts: ResourceCounts,
  propagationRule: PropagationRule
): BoardGenerationResult {
  // prime nextTileKey for first loop
  let nextTileKey = findLowestEntropyTile(board);

  // loop until no available tiles exist
  while (nextTileKey !== null) {
    // if tile has no resource options, this board cannot be completed
    if (board[nextTileKey].options?.length === 0) {
      return { board, complete: false };
    }

    // collapse tile to a specific resource and remove existing options
    let collapsedTileResource = chooseWeightedResource(board[nextTileKey] as UncollapsedTile, resourceTileCounts);
    board[nextTileKey] = { value: collapsedTileResource, options: null };

    // take 1 away from collapsed resource count
    resourceTileCounts[collapsedTileResource] -= 1;

    // if resource no longer exists, propagate to all tiles
    if (resourceTileCounts[collapsedTileResource] === 0) {
      for (const tile of Object.values(board)) {
        // skip assigned value tiles
        if (tile.value !== null) {
          continue;
        }
        tile.options = tile.options.filter((option) => option !== collapsedTileResource);
      }
    }

    // propagate using the current board, tile, and chosen collapsed resource
    // different propagation rules can be passed to change how the board is generated
    const propagationSucceeded = propagationRule(board, nextTileKey, collapsedTileResource);

    // if propagation failed, this board cannot be completed
    if (!propagationSucceeded) {
      return { board, complete: false };
    }

    // find next tile
    nextTileKey = findLowestEntropyTile(board);
  }

  // return complete board
  return { board, complete: true };
}

// generate resource boards until a complete one is found
function generateCompleteResourceBoard(
  board: Board,
  resourceTileCounts: ResourceCounts,
  propagationRule: PropagationRule
) {
  let result: BoardGenerationResult;

  let attempts = 0;

  // create fresh instances of board and counts for each new generation attempt
  do {
    attempts += 1;
    const freshBoard = structuredClone(board);
    const freshCounts = structuredClone(resourceTileCounts);
    result = generateBoardResources(freshBoard, freshCounts, propagationRule);
  } while (!result.complete);

  // return board when result yields a complete board
  return { board: result.board, attempts };
}

let resourceBoard = generateCompleteResourceBoard(generateHexBoard(2), resourceCounts, limitedSameResourceAdjacent);
console.log(resourceBoard);
