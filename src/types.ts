export type Resource = "wood" | "wheat" | "sheep" | "brick" | "ore" | "desert";

export type Coordinate = [number, number];

export interface UncollapsedTile {
  value: null;
  options: Resource[];
}

export interface CollapsedTile {
  value: Resource;
  options: null;
}

export type Tile = UncollapsedTile | CollapsedTile;

export type Board = {
  [q: number]: {
    [r: number]: Tile;
  };
};

export type ResourceCounts = { [key in Resource]: number };

export type PropagationRule = (board: Board, coordinate: Coordinate, resource: Resource) => boolean;

export interface BoardGenerationResult {
  board: Board;
  complete: boolean;
}
