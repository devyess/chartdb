import React, { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    useEdgesState,
    useNodesState,
    addEdge,
    Background,
    BackgroundVariant,
    MiniMap,
    Controls,
    NodePositionChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode, TableNodeType } from './table-node';
import { TableEdge, TableEdgeType } from './table-edge';
import { useChartDB } from '@/hooks/use-chartdb';

type AddEdgeParams = Parameters<typeof addEdge<TableEdgeType>>[0];

const initialNodes: TableNodeType[] = [];
const initialEdges: TableEdgeType[] = [];

export interface CanvasProps {}

export const Canvas: React.FC<CanvasProps> = () => {
    const { tables, updateTables, createRelationship } = useChartDB();
    const nodeTypes = useMemo(() => ({ table: TableNode }), []);
    const edgeTypes = useMemo(() => ({ 'table-edge': TableEdge }), []);

    const [nodes, setNodes, onNodesChange] =
        useNodesState<TableNodeType>(initialNodes);
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<TableEdgeType>(initialEdges);

    useEffect(() => {
        setNodes(
            tables.map((table) => ({
                id: table.id,
                type: 'table',
                position: { x: table.x, y: table.y },
                data: {
                    table,
                },
            }))
        );
    }, [tables, setNodes]);

    const onConnect = useCallback(
        (params: AddEdgeParams) => {
            createRelationship({
                sourceTableId: params.source,
                targetTableId: params.target,
                sourceFieldId: params.sourceHandle?.split('_')?.pop() ?? '',
                targetFieldId: params.targetHandle?.split('_')?.pop() ?? '',
            });
            return setEdges((edges) =>
                addEdge<TableEdgeType>({ ...params }, edges)
            );
        },
        [setEdges, createRelationship]
    );

    return (
        <div className="flex h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes) => {
                    const positionChanges: NodePositionChange[] =
                        changes.filter(
                            (change) =>
                                change.type === 'position' && !change.dragging
                        ) as NodePositionChange[];

                    if (positionChanges.length > 0) {
                        updateTables(
                            positionChanges.map((change) => ({
                                id: change.id,
                                x: change.position?.x,
                                y: change.position?.y,
                            }))
                        );
                    }

                    return onNodesChange(changes);
                }}
                onEdgesChange={(changes) => {
                    const selectionChanges = changes.filter(
                        (change) => change.type === 'select'
                    );

                    if (selectionChanges.length > 0) {
                        setEdges((edges) =>
                            edges.map((edge) => {
                                edge.zIndex = selectionChanges.some(
                                    (change) =>
                                        change.id === edge.id && change.selected
                                )
                                    ? 1
                                    : 0;
                                return edge;
                            })
                        );
                    }

                    return onEdgesChange(changes);
                }}
                onConnect={onConnect}
                proOptions={{
                    hideAttribution: true,
                }}
                fitView={false} // todo think about it
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{
                    animated: true,
                    type: 'table-edge',
                }}
            >
                <Controls />
                <MiniMap
                    style={{
                        width: 100,
                        height: 100,
                    }}
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    bgColor="#ffffff"
                />
            </ReactFlow>
        </div>
    );
};