import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFamilyTree } from '../FamilyTreeContext';
import { buildNodesAndEdges } from '../treeLayout';
import MemberNode from './MemberNode';
import CoupleNode from './CoupleNode';
import SpouseEdge from './SpouseEdge';
import ParentEdge from './ParentEdge';

const nodeTypes = {
  member: MemberNode,
  couple: CoupleNode,
};

const edgeTypes = {
  spouse: SpouseEdge,
  parent: ParentEdge,
};

function Canvas() {
  const { members, closeContextMenu } = useFamilyTree();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync when members change
  useEffect(() => {
    const { nodes: n, edges: e } = buildNodesAndEdges(members);
    setNodes(n);
    setEdges(e);
  }, [members]);

  const onPaneClick = useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ interactionWidth: 10 }}
    >
      <Background gap={20} color="#e5e7eb" />
      <Controls />
      <MiniMap
        nodeColor={(n) => {
          if (n.type === 'couple') return '#fbcfe8';
          const m = n.data?.member;
          if (!m) return '#e5e7eb';
          if (m.gender === 'male') return '#dbeafe';
          if (m.gender === 'female') return '#fce7f3';
          return '#f3f4f6';
        }}
        style={{ border: '1px solid #e5e7eb' }}
      />
    </ReactFlow>
  );
}

export default function FamilyTreeCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
