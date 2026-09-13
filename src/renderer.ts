import type { CollapsedBoard, ResourceColors, SvgPoint } from "./types";

const RESOURCE_COLORS: ResourceColors = {
  wood: "#4f8f45",
  wheat: "#e6c84f",
  sheep: "#8fbd61",
  brick: "#b85c3b",
  ore: "#777777",
  desert: "#d6b477",
};

const HEX_SIZE = 50;
const HALF_HEX_WIDTH = (Math.sqrt(3) * HEX_SIZE) / 2;
const VIEWBOX_PADDING = 5;

export function renderBoard(board: CollapsedBoard): void {
  const container = document.getElementById("board-container");

  // throw error if board container doesn't exist
  if (container === null) {
    throw new Error(`renderBoard: "board-container" not found`);
  }

  // clear container before rendering board
  container.replaceChildren();

  // check if board or any rows are empty
  const rows = Object.values(board);
  if (rows.length === 0) {
    // if board is empty, throw error
    throw new Error(`renderBoard: board is empty or contains empty rows`);
  }
  for (const row of rows) {
    if (Object.keys(row).length <= 0) {
      // if row in board is empty, throw error
      throw new Error(`renderBoard: board is empty or contains empty rows`);
    }
  }

  // create svg where hexes will be rendered
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

  // initialize maximum bounds for viewbox
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // render each hexagon
  for (const [rawQ, row] of Object.entries(board)) {
    const q = Number(rawQ);
    for (const [rawR, tile] of Object.entries(row)) {
      const r = Number(rawR);

      // create new hex
      const hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

      // calculate center of hex
      const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
      const y = ((HEX_SIZE * 3) / 2) * r;

      // calculate points for hex corners
      const points: SvgPoint[] = [
        [x, y - HEX_SIZE],
        [x + HALF_HEX_WIDTH, y - HEX_SIZE / 2],
        [x + HALF_HEX_WIDTH, y + HEX_SIZE / 2],
        [x, y + HEX_SIZE],
        [x - HALF_HEX_WIDTH, y + HEX_SIZE / 2],
        [x - HALF_HEX_WIDTH, y - HEX_SIZE / 2],
      ];

      // as hexes are iterated, store outer bounds values
      minX = Math.min(minX, x - HALF_HEX_WIDTH);
      maxX = Math.max(maxX, x + HALF_HEX_WIDTH);
      minY = Math.min(minY, y - HEX_SIZE);
      maxY = Math.max(maxY, y + HEX_SIZE);

      // set hex points
      hex.setAttribute("points", points.map(([px, py]) => `${px},${py}`).join(" "));

      // set hex visual attributes
      hex.style.fill = RESOURCE_COLORS[tile.value];
      hex.style.stroke = "black";
      hex.style.strokeWidth = "1";

      // add hex to svg board
      svg.appendChild(hex);
    }
  }

  // set viewbox based on bounds found while iterating over hexes
  svg.setAttribute(
    "viewBox",
    `${minX - VIEWBOX_PADDING} ${minY - VIEWBOX_PADDING} ${maxX - minX + VIEWBOX_PADDING * 2} ${maxY - minY + VIEWBOX_PADDING * 2}`
  );
  container.appendChild(svg);
}
