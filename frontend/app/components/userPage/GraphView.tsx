'use client';
import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import colors from '@src/design/color';
import { useParams, useRouter } from 'next/navigation';
import { useGraph } from '@src/hooks/useGraph';
import { Node, Coords } from '@api/graph/types';
import SideDataContext from '@(pages)/user-page/[userNickname]/SideDataContext';
import NodeSample from '@components/common/NodeSample';
import GraphConverter from '@components/common/GraphConverter';
import ForchGraph2D, {
  ForceGraphMethods as Force2DGraphMehods,
} from 'react-force-graph-2d';
import ForchGraph3D, {
  ForceGraphMethods as Force3DGraphMehods,
} from 'react-force-graph-3d';
import { NodeObject as Node3DObject } from 'react-force-graph-3d';
import { forceLink, forceManyBody } from 'd3-force';

interface GraphViewProps {
  theme: 'light' | 'dark';
}

export default function GraphView({ theme }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  // 크기 조절 변수
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const params = useParams();
  const nickname = decodeURIComponent(params.userNickname as string);
  const { graphData, getGraphData, noteGraphData, getNoteGraphData } =
    useContext(SideDataContext);

  const fg2dref = useRef<Force2DGraphMehods>();
  const fg3dref = useRef<Force3DGraphMehods>();
  const clickCountRef = useRef<number>(0);
  const lastClickedNodeRef = useRef<Node3DObject | null>(null);

  const [changeView, setChangeView] = useState<
    '2d' | '3d' | 'note2d' | 'note3d'
  >('note2d');

  useEffect(() => {
    getGraphData();
  }, [nickname]);

  useEffect(() => {
    getNoteGraphData();
  }, [nickname]);

  const {
    highlightLinks,
    handleNodeHover,
    handleLinkHover,
    nodePaint,
    node3dPaint,
    addNeighborsAndLinks,
  } = useGraph();

  const handleClick = (node: Node) => {
    if (node.type === 'note') {
      router.push(`/user-page/${nickname}/read-note/${node.realId}`);
    } else if (node.type === 'link') {
      router.push(`/user-page/${nickname}/read-note/${node.realId}`);
    } else {
      console.warn('존재하지 않는 노드입니다:', node.type);
    }
  };

  const onGraphChange = (current: '2d' | '3d' | 'note2d' | 'note3d') => {
    setChangeView(current);
  };

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  const chargeForce = forceManyBody().strength(-3);

  useEffect(() => {
    if (fg3dref.current) {
      fg3dref.current.cameraPosition({ x: 100, y: 100, z: 100 });

      fg3dref.current.d3Force('charge', chargeForce);
    } else if (fg2dref.current) {
      fg2dref.current.zoom(5);
      // 연결 힘 조정
      fg2dref.current.d3Force('charge', chargeForce);
    }
  }, [changeView]);
  addNeighborsAndLinks(graphData);
  addNeighborsAndLinks(noteGraphData);

  const zoomClick = useCallback(
    (node: Node3DObject) => {
      if (node === lastClickedNodeRef.current) {
        clickCountRef.current++;
      } else {
        clickCountRef.current = 1;
        lastClickedNodeRef.current = node;
      }

      if (clickCountRef.current === 1) {
        // 첫 번째 클릭
        if (node.x && node.y && node.z) {
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          if (fg3dref.current) {
            const newPosition: Partial<Coords> = {
              x: node.x * distRatio,
              y: node.y * distRatio,
              z: node.z * distRatio,
            };
            const lookAt: Coords = {
              x: node.x,
              y: node.y,
              z: node.z,
            };
            fg3dref.current.cameraPosition(newPosition, lookAt, 3000);
          }
        }
      } else if (clickCountRef.current === 2) {
        // 두 번째 클릭
        if (node.type === 'note') {
          router.push(`/user-page/${nickname}/read-note/${node.realId}`);
        } else if (node.type === 'link') {
          router.push(`/user-page/${nickname}/read-link/${node.realId}`);
        } else {
          console.warn('존재하지 않는 노드입니다:', node.type);
        }
        clickCountRef.current = 0;
      }
    },
    [fg3dref, router]
  );

  return (
    <div
      className="w-full h-full flex flex-col justify-center items-center relative"
      ref={containerRef}
    >
      <div className="flex absolute top-0 left-0 p-3 z-10 items-center">
        <NodeSample theme={theme} type="folder" text="폴더" />
        {theme === 'light' ? (
          <NodeSample theme={theme} type="noteLight" text="노트" />
        ) : (
          <NodeSample theme={theme} type="noteDark" text="노트" />
        )}

        <NodeSample theme={theme} type="link" text="참조" />
      </div>
      <div className="absolute top-0 right-0 p-3 z-10">
        <GraphConverter current={changeView} onGraphChange={onGraphChange} />
      </div>
      {changeView === '2d' && (
        <ForchGraph2D
          ref={fg2dref}
          graphData={graphData}
          width={dimensions.width - 30}
          height={dimensions.height - 30}
          onNodeClick={handleClick}
          linkColor={colors.black}
          linkWidth={(link) => (highlightLinks.has(link) ? 5 : 1)}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={(link) =>
            highlightLinks.has(link) ? 3 : 0
          }
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          nodeCanvasObject={nodePaint}
        />
      )}

      {changeView === '3d' && (
        <ForchGraph3D
          ref={fg3dref}
          graphData={graphData}
          width={dimensions.width - 30}
          height={dimensions.height - 30}
          onNodeClick={zoomClick}
          backgroundColor="rgba(255, 255, 255, 0)"
          nodeColor={colors.black}
          nodeThreeObject={node3dPaint}
          linkColor={() => colors.grey}
          showNavInfo={false}
        />
      )}

      {changeView === 'note2d' && (
        <ForchGraph2D
          ref={fg2dref}
          graphData={noteGraphData}
          width={dimensions.width - 30}
          height={dimensions.height - 30}
          onNodeClick={handleClick}
          linkColor={colors.black}
          linkWidth={(link) => (highlightLinks.has(link) ? 5 : 1)}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={(link) =>
            highlightLinks.has(link) ? 3 : 0
          }
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          nodeCanvasObject={nodePaint}
        />
      )}

      {changeView === 'note3d' && (
        <ForchGraph3D
          ref={fg3dref}
          graphData={noteGraphData}
          width={dimensions.width - 30}
          height={dimensions.height - 30}
          onNodeClick={zoomClick}
          backgroundColor="rgba(255, 255, 255, 0)"
          nodeColor={colors.black}
          nodeThreeObject={node3dPaint}
          linkColor={() => colors.grey}
          showNavInfo={false}
        />
      )}
    </div>
  );
}
