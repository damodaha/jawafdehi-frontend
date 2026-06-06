export type ProcessNode = {
  number: string;
  x: number;
  y: number;
};

export const PROCESS_ARC_RADIUS = 160;
export const PROCESS_LEFT_X = 180;
export const PROCESS_RIGHT_X = 1820;
export const PROCESS_START_X = 760;
export const PROCESS_END_X = 1320;
export const PROCESS_FIRST_NODE_Y = 220;
export const PROCESS_ROW_GAP = PROCESS_ARC_RADIUS * 2;
export const PROCESS_STEP_COUNT = 6;

export const PROCESS_PATH_VIEWBOX = {
  width: 2000,
  height: PROCESS_FIRST_NODE_Y + PROCESS_ROW_GAP * (PROCESS_STEP_COUNT - 1) + PROCESS_ARC_RADIUS,
} as const;

export const PROCESS_PATH_NODES: ProcessNode[] = Array.from(
  { length: PROCESS_STEP_COUNT },
  (_, index) => ({
    number: String(index + 1).padStart(2, "0"),
    x: index % 2 === 0 ? PROCESS_LEFT_X : PROCESS_RIGHT_X,
    y: PROCESS_FIRST_NODE_Y + PROCESS_ROW_GAP * index,
  })
);

export const PROCESS_NODE_SIZE = PROCESS_ARC_RADIUS * 1.6;
