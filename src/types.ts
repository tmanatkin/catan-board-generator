export type Resource = "wood" | "wheat" | "sheep" | "brick" | "ore" | "desert";

export type Coordinate = [number, number];

export type CoordinateKey = `${number},${number}`;

export interface UncollapsedTile {
  value: null;
  options: Resource[];
}

export interface CollapsedTile {
  value: Resource;
  options: null;
}

export type Tile = UncollapsedTile | CollapsedTile;

export type Board = { [key: CoordinateKey]: Tile };

export type ResourceCounts = { [key in Resource]: number };

export type PropagationRule = (board: Board, coordinate: CoordinateKey, resource: Resource) => boolean;

export interface BoardGenerationResult {
  board: Board;
  complete: boolean;
}
