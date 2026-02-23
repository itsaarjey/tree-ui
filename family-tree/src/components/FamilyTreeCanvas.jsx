import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFamilyTree } from '../FamilyTreeContext';
import { buildNodesAndEdges } from '../treeLayout';
import { buildEgoCentricLayout } from '../egoLayout';
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
  const {
    members,
    closeContextMenu,
    selectedMemberId,
    clearSelection,
  } = useFamilyTree();

  const { fitView, getViewport, getInternalNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Track whether this is the very first load (skip animation on initial render)
  const isFirstLoad = useRef(true);
  // Track previous selectedMemberId so we know when it changes
  const prevSelectedRef = useRef(null);
  // Ref to the wrapper div so we can toggle the layout-initial class
  const wrapperRef = useRef(null);

  useEffect(() => {
    const isFirst = isFirstLoad.current;
    isFirstLoad.current = false;
    const selectionChanged = selectedMemberId !== prevSelectedRef.current;
    prevSelectedRef.current = selectedMemberId;

    // ── Capture ego card's current SCREEN position BEFORE layout changes ──
    // We do this synchronously here, before setNodes, so the old positions
    // are still live in the React Flow internal store.
    let screenAnchorX = null;  // screen-pixel X of ego card top-left
    let screenAnchorY = null;
    let egoLayoutX    = null;  // where the ego card will be in the NEW layout
    let egoLayoutY    = null;

    const { nodes: n, edges: e } = selectedMemberId
      ? buildEgoCentricLayout(members, selectedMemberId)
      : buildNodesAndEdges(members);

    if (!isFirst && selectionChanged && selectedMemberId) {
      // Get the ego node's current position on screen (flow → screen coords)
      const internalNode = getInternalNode(selectedMemberId);
      if (internalNode) {
        const vp = getViewport();
        // React Flow: screen = flow * zoom + pan
        screenAnchorX = internalNode.internals.positionAbsolute.x * vp.zoom + vp.x;
        screenAnchorY = internalNode.internals.positionAbsolute.y * vp.zoom + vp.y;
      }

      // Find where the ego card lands in the NEW layout
      const egoNode = n.find((nd) => nd.id === selectedMemberId);
      if (egoNode) {
        egoLayoutX = egoNode.position.x;
        egoLayoutY = egoNode.position.y;
      }

      // If we have both, offset ALL new node positions so ego stays on screen
      if (screenAnchorX !== null && egoLayoutX !== null) {
        const vp = getViewport();
        // What flow-coord would put the ego card at screenAnchorX/Y?
        const desiredFlowX = (screenAnchorX - vp.x) / vp.zoom;
        const desiredFlowY = (screenAnchorY - vp.y) / vp.zoom;
        // Offset: difference between where ego will be and where it should be
        const dx = desiredFlowX - egoLayoutX;
        const dy = desiredFlowY - egoLayoutY;
        // Apply offset to every node in the new layout
        for (const node of n) {
          node.position = { x: node.position.x + dx, y: node.position.y + dy };
        }
      }
    }

    // Suppress CSS transitions on first load
    if (isFirst && wrapperRef.current) {
      wrapperRef.current.classList.add('layout-initial');
    }

    setNodes(n);
    setEdges(e);

    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        // Remove the suppression class now that first paint is done
        if (wrapperRef.current) {
          wrapperRef.current.classList.remove('layout-initial');
        }

        // Only fitView on first load or when deselecting (returning to full tree)
        if (isFirst || (!selectedMemberId && selectionChanged)) {
          fitView({ padding: 0.25, duration: isFirst ? 0 : 500 });
        }
        // When selecting ego: viewport stays still, nodes animate around the ego card
      }, 50);
    });

    return () => cancelAnimationFrame(raf);
  }, [members, selectedMemberId]);

  const onPaneClick = useCallback(() => {
    closeContextMenu();
    clearSelection();
  }, [closeContextMenu, clearSelection]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.05}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ interactionWidth: 10 }}
      className={selectedMemberId ? 'ego-layout' : ''}
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
    </div>
  );
}

export default function FamilyTreeCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
