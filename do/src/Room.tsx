import {
    Comments,
    MousePointers,
    useComments,
    useHTMLPin,
    useMouse,
    WhoIsOnline,
  } from "@superviz/react-sdk";
  import { Realtime, type Channel } from "@superviz/realtime";
  import { useCallback, useEffect, MouseEvent, useRef } from "react";
  import ReactFlow, {
    useNodesState,
    Controls,
    Background,
    ConnectionLineType,
    addEdge,
    useEdgesState,
    ConnectionMode,
    Connection,
    useViewport,
    Node,
  } from "reactflow";
  import "reactflow/dist/style.css";
  
  type Edge = {
    type: ConnectionLineType;
    animated: boolean;
    source: string | null;
    target: string | null;
    sourceHandle: string | null;
    targetHandle: string | null;
  };
  
  const initialNodes = [
    { id: "1", position: { x: 381, y: 265 }, data: { label: "Start" } },
    { id: "2", position: { x: 556, y: 335 }, data: { label: "Action" } },
    { id: "3", position: { x: 701, y: 220 }, data: { label: "Process" } },
    { id: "4", position: { x: 823, y: 333 }, data: { label: "End" } },
  ];
  
  const initialEdges = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      type: ConnectionLineType.SmoothStep,
      animated: true,
    },
    {
      id: "e2-3",
      source: "2",
      target: "3",
      type: ConnectionLineType.SmoothStep,
      animated: true,
    },
    {
      id: "e3-4",
      source: "3",
      target: "4",
      type: ConnectionLineType.SmoothStep,
      animated: true,
    },
  ];
  
  type Props = {
    participantId: string;
  };
  
  const developerKey = "49lnmvunajwjn068ffx170xmkwg2s8";
  
  export default function Room({ participantId }: Props) {
    const initialized = useRef(false);
    const channel = useRef<Channel>();
  
    const { openThreads, closeThreads } = useComments();
    const { transform } = useMouse();
    const { pin } = useHTMLPin({
      containerId: "react-flow-container",
      dataAttributeName: "data-id",
      dataAttributeValueFilters: [/.*null-(target|source)$/],
    });
  
    const { x, y, zoom } = useViewport();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
    const initializeRealtime = useCallback(async () => {
      if (initialized.current) return;
      initialized.current = true;
  
      const realtime = new Realtime(developerKey, {
        participant: {
          id: participantId,
          name: "Participant",
        },
      });
  
      channel.current = await realtime.connect("react-flow-tutorial");
  
      const centerNodes = () => {
        const centerButton = document.querySelector(
          ".react-flow__controls-fitview"
        ) as HTMLButtonElement;
        centerButton?.click();
      };
  
      centerNodes();
  
      channel.current!.subscribe<{ edge: Edge }>(
        "new-edge",
        ({ data, participantId: senderId }) => {
          if (senderId === participantId) return;
  
          setEdges((eds) => addEdge(data.edge, eds));
        }
      );
  
      channel.current!.subscribe<{ node: Node }>(
        "node-drag",
        ({ data, participantId: senderId }) => {
          if (senderId === participantId) return;
  
          setNodes((nds) =>
            nds.map((node) =>
              node.id === data.node.id ? { ...node, ...data.node } : node
            )
          );
        }
      );
    }, [participantId, setEdges, setNodes]);
  
    useEffect(() => {
      initializeRealtime();
  
      return () => {
        channel.current?.disconnect();
      };
    }, [initializeRealtime]);
  
    const onConnect = useCallback(
      (connection: Connection) => {
        const edge: Edge = {
          ...connection,
          type: ConnectionLineType.SmoothStep,
          animated: true,
        };
  
        setEdges((eds) => addEdge(edge, eds));
  
        channel.current!.publish("new-edge", {
          edge,
        });
      },
      [setEdges]
    );
  
    const onDragOver = useCallback(
      (event: React.DragEvent<HTMLButtonElement | HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      []
    );
  
    const onNodeDrag = useCallback(
      (_: MouseEvent, node: Node) => {
        channel.current?.publish("node-drag", { node });
      },
      [channel]
    );
  
    useEffect(() => {
      transform({
        translate: {
          x: x,
          y: y,
        },
        scale: zoom,
      });
    }, [x, y, zoom, transform]);
  
    useEffect(() => {
      const element = document.querySelector(".react-flow__pane");
  
      if (!element) return;
  
      element.setAttribute("data-superviz-id", "plane");
    }, []);
  
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center flex-col">
        <header className="w-full p-5 bg-purple-400 flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">React Flow + SuperViz</h1>
          <div id="comments" className="flex gap-2"></div>
        </header>
        <main className="flex-1 w-full h-full">
          <div id="react-flow-container" className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              onNodeDrag={onNodeDrag}
              edges={edges}
              onConnect={onConnect}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onDragOver={onDragOver}
              connectionMode={ConnectionMode.Loose}
            >
              <Controls showFitView={false} />
              <Background />
            </ReactFlow>
          </div>
            
          {/* <WhoIsOnline position="comments" /> 
            <Comments 
                pin={pin} 
                position="left" 
                buttonLocation="comments" 
                onPinActive={openThreads} 
                onPinInactive={closeThreads} 
            /> 
            <MousePointers elementId="react-flow-container" />  */}
        </main>
      </div>
    );
  }