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

export function renderBoard(board: CollapsedBoard): void {
  const container = document.getElementById("board-container");

  // throw error if board container doesn't exist
  if (container === null) {
    throw new Error(`renderBoard: "board-container" not found`);
  }

  // clear container before rendering board
  container.replaceChildren();

  // create svg where hexes will be rendered
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

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

  svg.setAttribute("viewBox", "-300 -300 600 600"); // TODO: dynamic rendering based on size
  container.appendChild(svg);
}
