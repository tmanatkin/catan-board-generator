type Resource = "wood" | "wheat" | "sheep" | "brick" | "ore" | "desert";

interface Tile {
  options: Resource[];
  value: Resource | null;
}

type Board = { [key: string]: Tile };

type Coordinates = [number, number];

type ResourceCounts = { [key in Resource]: number };

const RESOURCE_OPTIONS: Resource[] = ["wood", "wheat", "sheep", "brick", "ore", "desert"];

const NEIGHBOR_COORDINATES: Coordinates[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

let resourceTileCounts: ResourceCounts = {
  wood: 4,
  wheat: 4,
  sheep: 4,
  brick: 3,
  ore: 3,
  desert: 1,
};

function coordKey([q, r]: Coordinates): string {
  return `${q},${r}`;
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
function getNeighbors(board: Board, [q, r]: Coordinates): Tile[] {
  const neighbors: Tile[] = [];

  // for every set of neighbor coordinates
  for (const [dq, dr] of NEIGHBOR_COORDINATES) {
    // find neighbor tile to current coordinates
    const neighbor = board[coordKey([q + dq, r + dr])];

    // if a tile exists
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

// choose resource option to collapse to, weighted on the available count
function chooseWeightedCollapse(tile: Tile, resourceTileCounts: ResourceCounts): Resource {
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
    `chooseWeightedCollapse: no resource selected choice=${choice}, runningTotal=${runningTotal}, options=${tile.options}`
  );
}

// traditional board
let board = generateHexBoard(2);

// NEXT
// lowest entropy tile selection (tile with the least amount of options)
