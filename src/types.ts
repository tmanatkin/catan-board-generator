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

export type Board<TileType extends Tile = Tile> = {
  [q: number]: {
    [r: number]: TileType;
  };
};

export type UncollapsedBoard = Board<UncollapsedTile>;

export type CollapsedBoard = Board<CollapsedTile>;

export type ResourceCounts = { [key in Resource]: number };

export type PropagationRule = (board: Board, coordinate: Coordinate, resource: Resource) => boolean;

export type BoardGenerationResult =
  | {
      board: CollapsedBoard;
      complete: true;
    }
  | {
      board: Board;
      complete: false;
    };
