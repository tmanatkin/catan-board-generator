import type { Board } from "./types";

export function renderBoard(board: Board): void {
  let container = document.getElementById("board-container");

  // throw error if board container doesn't exist
  if (container === null) {
    throw new Error(`renderBoard: "board-container" not found`);
  }

  // svg will store all hexes
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // temp hex test
  let hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  let size = 50;
  let q = 0;
  let r = 0;

  let x = size * Math.sqrt(3) * (q + r / 2);
  let y = ((size * 3) / 2) * r;

  const points = [
    [x, y - size],
    [x + (Math.sqrt(3) * size) / 2, y - size / 2],
    [x + (Math.sqrt(3) * size) / 2, y + size / 2],
    [x, y + size],
    [x - (Math.sqrt(3) * size) / 2, y + size / 2],
    [x - (Math.sqrt(3) * size) / 2, y - size / 2],
  ];

  hex.setAttribute("points", points.map(([px, py]) => `${px},${py}`).join(" "));

  svg.setAttribute("viewBox", "-50 -50 100 100");

  hex.setAttribute("fill", "red");

  svg.appendChild(hex);
  container.appendChild(svg);

  console.log(board);
}
