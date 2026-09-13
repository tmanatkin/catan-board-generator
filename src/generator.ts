// TODO
// no resource tiles too close to their matching port

// no two of (same number)/(six or eight) next to each other
// no (same number)/(six or eight) on the same resource

import type {
  Board,
  BoardGenerationResult,
  Coordinate,
  PropagationRule,
  Resource,
  ResourceCounts,
  UncollapsedTile,
} from "./types";

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

      // create q row if doesn't exist
      if (board[q] === undefined) {
        board[q] = {};
      }

      // create starting entry tile objects
      board[q][r] = {
        options: [...RESOURCE_OPTIONS],
        value: null,
      };
    }
  }

  // return generated board
  return board;
}

// get neighbors for current tile
function getNeighbors(board: Board, [q, r]: Coordinate): Coordinate[] {
  const coordinates: Coordinate[] = [];

  // for every set of neighbor coordinates
  for (const [dq, dr] of NEIGHBOR_COORDINATES) {
    // find neighbor tile to current coordinates
    const neighborQ = q + dq;
    const neighborR = r + dr;

    // if a tile exists
    if (board[neighborQ]?.[neighborR]) {
      coordinates.push([neighborQ, neighborR]);
    }
  }

  return coordinates;
}

// choose resource option to collapse to, weighted on the available count
function chooseWeightedResource(tile: UncollapsedTile, resourceTileCounts: ResourceCounts): Resource {
  let runningTotal = 0;

  // add to running total for number of each available resource
  for (const option of tile.options) {
    runningTotal += resourceTileCounts[option];
  }

  // pick a random number along the possible scale
  const choice = Math.random() * runningTotal;
  let cumulativeWeight = 0;

  // iterate through possible resources and find choice based on set scale
  for (const resource of tile.options) {
    cumulativeWeight += resourceTileCounts[resource];
    if (choice < cumulativeWeight) {
      return resource;
    }
  }

  throw new Error(
    `chooseWeightedResource: no resource selected choice=${choice}, runningTotal=${runningTotal}, options=${tile.options}`
  );
}

// selects tile with lowest entropy (least amount of choice), if entropy is equal randomly choose
function findLowestEntropyTile(board: Board): Coordinate | null {
  let lowestEntropy = Infinity;
  let candidates: Coordinate[] = [];

  for (const [q, row] of Object.entries(board)) {
    for (const [r, tile] of Object.entries(row)) {
      const coordinate: Coordinate = [Number(q), Number(r)]; // convert q and r to numbers, as object.entries converts them strings

      // skip tiles that have already been assigned a value
      if (tile.value !== null) continue;

      // if lowest entropy found, set as candidate
      if (tile.options.length < lowestEntropy) {
        lowestEntropy = tile.options.length;
        candidates = [coordinate];
      }
      // if another lowest entropy candidate found, save it
      else if (tile.options.length === lowestEntropy) {
        candidates.push(coordinate);
      }
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
function noSameResourceAdjacent(board: Board, coordinate: Coordinate, resource: Resource): boolean {
  for (const [nq, nr] of getNeighbors(board, coordinate)) {
    // skip assigned value tiles
    if (board[nq][nr].value !== null) {
      continue;
    }
    board[nq][nr].options = board[nq][nr].options.filter((option) => option !== resource);
  }

  return true; // propagation rule succeeded (no fail states exist for this one)
}

// tiles are limited to sharing the same resource as their neighbor
// brick and ore cannot neighbor the same resource
// wood, wheat, and sheep cannot have more than 2 neighbors of the same resource
function limitedSameResourceAdjacent(board: Board, coordinate: Coordinate, resource: Resource): boolean {
  // fallback to no same resource adjacent rule if brick or ore
  if (resource === "brick" || resource === "ore") {
    return noSameResourceAdjacent(board, coordinate, resource);
  }

  let matchingNeighbors: Coordinate[] = [];

  // limit to 2 touching same resources for wood, wheat, sheep
  for (const [nq, nr] of getNeighbors(board, coordinate)) {
    // if neighbor has a resource match, count it
    if (board[nq][nr].value === resource) {
      matchingNeighbors.push([nq, nr]);
    }
  }

  // if placing this tile creates a cluster of two, remove options from cluster neighbors
  if (matchingNeighbors.length === 1) {
    const tPropSucc = noSameResourceAdjacent(board, coordinate, resource);
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
  // initialize nextCoordinate for first loop
  let nextCoordinate = findLowestEntropyTile(board);

  // loop until no available tiles exist
  while (nextCoordinate !== null) {
    const [q, r] = nextCoordinate;

    // catch error and throw if tile is already collapsed
    if (board[q][r].value !== null) {
      throw new Error("generateBoardResources: expected an uncollapsed tile");
    }

    // if uncollapsed tile has no more resource options, this board cannot be completed
    if (board[q][r].options.length === 0) {
      return { board, complete: false };
    }

    // collapse tile to a specific resource and remove existing options
    const collapsedTileResource = chooseWeightedResource(board[q][r], resourceTileCounts);
    board[q][r] = { value: collapsedTileResource, options: null };

    // take 1 away from collapsed resource count
    resourceTileCounts[collapsedTileResource] -= 1;

    // if resource no longer exists, propagate to all tiles
    if (resourceTileCounts[collapsedTileResource] === 0) {
      for (const row of Object.values(board)) {
        for (const tile of Object.values(row)) {
          // skip assigned value tiles
          if (tile.value !== null) {
            continue;
          }
          tile.options = tile.options.filter((option) => option !== collapsedTileResource);
        }
      }
    }

    // propagate using the current board, tile, and chosen collapsed resource
    // different propagation rules can be passed to change how the board is generated
    const propagationSucceeded = propagationRule(board, nextCoordinate, collapsedTileResource);

    // if propagation failed, this board cannot be completed
    if (!propagationSucceeded) {
      return { board, complete: false };
    }

    // find next tile
    nextCoordinate = findLowestEntropyTile(board);
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
    // TODO create a limit so this won't generate infinitely
  } while (!result.complete);

  // return board when result yields a complete board
  return { board: result.board, attempts };
}

// TODO: Remove hardcoded values here
export function generateResourceBoard(): Board {
  const result = generateCompleteResourceBoard(generateHexBoard(2), resourceCounts, limitedSameResourceAdjacent);
  return result.board;
}
