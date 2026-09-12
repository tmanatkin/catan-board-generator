import "./style.scss";

import { generateResourceBoard } from "./generator";
import { renderBoard } from "./renderer";

renderBoard(generateResourceBoard());
