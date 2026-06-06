import {
  PROCESS_ARC_RADIUS,
  PROCESS_END_X,
  PROCESS_NODE_SIZE,
  PROCESS_PATH_NODES,
  PROCESS_PATH_VIEWBOX,
  PROCESS_RIGHT_X,
  PROCESS_START_X,
  type ProcessNode,
} from "@/components/ourprocess/process-path-config";

type DottedProcessPathProps = {
  width?: number | string;
  height?: number | string;
  stroke?: string;
  strokeWidth?: number;
  dotSize?: number;
  dotGap?: number;
  nodeSize?: number;
  nodes?: ProcessNode[];
  className?: string;
};

function buildProcessPath(nodes: ProcessNode[]) {
  if (nodes.length === 0) {
    return "";
  }

  const [firstNode, ...remainingNodes] = nodes;
  const commands = [
    `M ${PROCESS_START_X} ${firstNode.y - PROCESS_ARC_RADIUS}`,
    `H ${firstNode.x}`,
    `A ${PROCESS_ARC_RADIUS} ${PROCESS_ARC_RADIUS} 0 0 0 ${firstNode.x} ${
      firstNode.y + PROCESS_ARC_RADIUS
    }`,
  ];

  remainingNodes.forEach((node, index) => {
    const isRightNode = node.x === PROCESS_RIGHT_X;
    const sweepFlag = isRightNode ? 1 : 0;

    commands.push(
      `H ${node.x}`,
      `A ${PROCESS_ARC_RADIUS} ${PROCESS_ARC_RADIUS} 0 0 ${sweepFlag} ${node.x} ${
        node.y + PROCESS_ARC_RADIUS
      }`
    );

    if (index === remainingNodes.length - 1) {
      commands.push(`H ${PROCESS_END_X}`);
    }
  });

  return commands.join(" ");
}

export function DottedProcessPath({
  width = "100%",
  height = "100%",
  stroke = "hsl(var(--primary))",
  strokeWidth = 4,
  dotSize = 2,
  dotGap = 14,
  nodeSize = PROCESS_NODE_SIZE,
  nodes = PROCESS_PATH_NODES,
  className,
}: DottedProcessPathProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${PROCESS_PATH_VIEWBOX.width} ${PROCESS_PATH_VIEWBOX.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d={buildProcessPath(nodes)}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${dotSize} ${dotGap}`}
        vectorEffect="non-scaling-stroke"
      />

      {nodes.map((node) => (
        <g key={node.number}>
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeSize / 2}
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={stroke}
            fontFamily="Helvetica, Arial, 'Noto Sans Devanagari', sans-serif"
            fontSize="42"
            fontWeight="800"
          >
            {node.number}
          </text>
        </g>
      ))}
    </svg>
  );
}
