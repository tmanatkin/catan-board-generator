export type Resource = "wood" | "wheat" | "sheep" | "brick" | "ore" | "desert";

export type Coordinate = [q: number, r: number];

export interface UncollapsedTile {
  value: null;
  options: Resource[];
}

export interface CollapsedTile {
  value: Resource;
  options: null;
}

export type Tile = UncollapsedTile | CollapsedTile;

export type Board<TileType extends Tile = Tile> = Record<number, Record<number, TileType>>;

export type UncollapsedBoard = Board<UncollapsedTile>;

export type CollapsedBoard = Board<CollapsedTile>;

export type ResourceCounts = Record<Resource, number>;

export type PropagationRule = (board: Board, coordinate: Coordinate, resource: Resource) => boolean;

export type BoardGenerationResult =
  // collapsed board that is complete
  | {
      board: CollapsedBoard;
      complete: true;
    }
  // partially collapsed/uncollapsed board that is incomplete
  | {
      board: Board;
      complete: false;
    };

export type SvgPoint = [x: number, y: number];

export type ResourceColors = Record<Resource, string>;
