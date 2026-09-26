import React, { useState } from 'react';

interface MockupProps {
  slideId: number;
}

export const DiagramMockup: React.FC<MockupProps> = ({ slideId }) => {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  if (slideId === 1) {
    // High-Level Topology Architecture
    const nodes = [
      { id: 1, title: 'Edge CDN / DNS', role: 'Global Ingress', desc: 'Anycast DNS / SSL Offloading' },
      { id: 2, title: 'API Gateway', role: 'mTLS & Auth', desc: 'Rate Limiting / Route Mesh' },
      { id: 3, title: 'Core App Cluster', role: 'Microservices', desc: 'Auto-scaled Pod Replicas' },
      { id: 4, title: 'Event Broker', role: 'Pub/Sub Queue', desc: 'Async Message Bus' },
      { id: 5, title: 'Distributed DB', role: 'Read/Write Splitting', desc: 'Multi-Region Shards' },
    ];

    return (
      <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[#a3a3a3]">TOPOLOGY_SCHEMATIC_V1</span>
          </div>
          <div className="font-mono text-[11px] text-[#525252]">
            NODE_COUNT: 05 / CONN: 08
          </div>
        </div>

        {/* Nodes interactive layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-auto py-8">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
              className={`p-4 rounded border transition-all cursor-pointer select-none flex flex-col justify-between ${
                activeNode === node.id
                  ? 'bg-white text-black border-white shadow-xl scale-[1.02]'
                  : 'bg-[#141414] text-[#cccccc] border-[#262626] hover:border-[#444444] hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  activeNode === node.id ? 'bg-black text-white' : 'bg-[#222222] text-[#888888]'
                }`}>
                  0{node.id}
                </span>
                <span className={`text-[10px] font-mono ${
                  activeNode === node.id ? 'text-black/70' : 'text-[#666666]'
                }`}>
                  {node.role}
                </span>
              </div>
              <div className="font-medium text-sm mb-1">{node.title}</div>
              <div className={`text-xs ${activeNode === node.id ? 'text-black/80' : 'text-[#777777]'}`}>
                {node.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
          <span>STATUS: READY FOR SVG / REACT COMPONENT INJECTION</span>
          <span>TARGET CONTAINER: #slide-content-1</span>
        </div>
      </div>
    );
  }

  if (slideId === 2) {
    // Streaming Data Pipeline
    const streams = [
      { step: '01. Ingestion', rate: '124,000 evt/s', latency: '4ms', status: 'Optimal' },
      { step: '02. Kafka Bus', rate: '256 Partitions', latency: '2ms', status: 'Balanced' },
      { step: '03. Flink Stream', rate: 'Windowing 10s', latency: '12ms', status: 'Processing' },
      { step: '04. Sink Storage', rate: 'Parquet / S3', latency: '18ms', status: 'Flushing' },
    ];

    return (
      <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
          <span className="font-mono text-[#a3a3a3]">PIPELINE_FLOW_SPECIFICATION</span>
          <span className="font-mono text-[11px] text-[#525252]">STREAM_MODE: CONTINUOUS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-auto py-8">
          {streams.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded border border-[#262626] bg-[#141414] hover:border-[#444] transition-all flex flex-col justify-between"
            >
              <div className="text-xs font-mono text-[#888] mb-2">{item.step}</div>
              <div className="text-lg font-mono font-semibold text-white mb-1">{item.rate}</div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#777]">
                <span>P99: {item.latency}</span>
                <span className="text-[#a3a3a3]">{item.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
          <span>EVENT PROTOCOL: APACHE ARROW & AVRO SCHEMA</span>
          <span>TARGET CONTAINER: #slide-content-2</span>
        </div>
      </div>
    );
  }

  if (slideId === 3) {
    // Security & Auth Sequence
    const steps = [
      { num: 'A', name: 'Client Initiates PKCE', detail: 'Code Challenge & State Generation' },
      { num: 'B', name: 'Identity Provider Handshake', detail: 'mTLS Verification & Biometric Challenge' },
      { num: 'C', name: 'Token Minting & Signing', detail: 'EdDSA JWT with Claims Payload' },
      { num: 'D', name: 'Gatekeeper Verification', detail: 'Zero-Trust Policy Validation at Edge' },
    ];

    return (
      <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
          <span className="font-mono text-[#a3a3a3]">AUTH_SEQUENCE_TOPOLOGY</span>
          <span className="font-mono text-[11px] text-[#525252]">SECURITY_LEVEL: NIST 800-63B</span>
        </div>

        <div className="space-y-3 my-auto py-6 max-w-2xl mx-auto w-full">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-3.5 rounded border border-[#262626] bg-[#141414] flex items-center justify-between hover:bg-[#1a1a1a] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-[#262626] text-white flex items-center justify-center font-mono text-xs font-semibold">
                  {st.num}
                </span>
                <div>
                  <div className="text-sm font-medium text-[#eaeaea]">{st.name}</div>
                  <div className="text-xs text-[#777] font-mono">{st.detail}</div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/90 border border-emerald-950/80 bg-emerald-950/30 px-2 py-0.5 rounded">
                VERIFIED
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
          <span>ZERO-TRUST INGRESS ENFORCEMENT</span>
          <span>TARGET CONTAINER: #slide-content-3</span>
        </div>
      </div>
    );
  }

  if (slideId === 4) {
    // Database Sharding & Storage
    const shards = [
      { id: 'SHARD_01', region: 'us-east-1', role: 'Leader', sync: '0.8ms' },
      { id: 'SHARD_02', region: 'us-west-2', role: 'Follower', sync: '12.4ms' },
      { id: 'SHARD_03', region: 'eu-central-1', role: 'Follower', sync: '24.1ms' },
    ];

    return (
      <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
          <span className="font-mono text-[#a3a3a3]">DISTRIBUTED_SHARDS_OVERVIEW</span>
          <span className="font-mono text-[11px] text-[#525252]">CONSISTENT_HASH_RING: ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto py-8">
          {shards.map((shard) => (
            <div
              key={shard.id}
              className="p-5 rounded border border-[#262626] bg-[#141414] flex flex-col justify-between hover:border-[#404040] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-white">{shard.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-[#a0a0a0]">
                    {shard.role}
                  </span>
                </div>
                <div className="text-xs text-[#777] font-mono mb-4">{shard.region}</div>
              </div>
              <div className="text-xs font-mono text-[#999] border-t border-[#1f1f1f] pt-3 flex justify-between">
                <span>REPLICATION LAG</span>
                <span className="text-white font-semibold">{shard.sync}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
          <span>RAFT CONSENSUS QUORUM: 3/3 NODES ACKNOWLEDGED</span>
          <span>TARGET CONTAINER: #slide-content-4</span>
        </div>
      </div>
    );
  }

  if (slideId === 5) {
    // AI & Vector Pipeline
    const stages = [
      { name: 'Chunker & Normalizer', desc: 'Recursive text splitting & clean' },
      { name: 'Embedding Generator', desc: 'Dense 1536-dimensional vectors' },
      { name: 'Vector DB Index', desc: 'Hierarchical Navigable Small World' },
      { name: 'Reranker & LLM', desc: 'Cross-attention scoring & response' },
    ];

    return (
      <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
          <span className="font-mono text-[#a3a3a3]">RAG_INFERENCE_PIPELINE_GRAPH</span>
          <span className="font-mono text-[11px] text-[#525252]">SIMILARITY: COSINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-auto py-8">
          {stages.map((stg, i) => (
            <div
              key={i}
              className="p-4 rounded border border-[#262626] bg-[#141414] flex flex-col justify-between relative hover:border-[#444] transition-all"
            >
              <div className="text-[10px] font-mono text-[#666] mb-2">STAGE 0{i + 1}</div>
              <div className="text-sm font-semibold text-[#e5e5e5] mb-2">{stg.name}</div>
              <div className="text-xs text-[#777] font-mono">{stg.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
          <span>RETRIEVAL LATENCY P95: 180MS</span>
          <span>TARGET CONTAINER: #slide-content-5</span>
        </div>
      </div>
    );
  }

  // Slide 6: DevOps & Observability
  const stages = [
    { title: 'Git Commit & Test', metrics: '1,420 Tests Passed', status: 'GREEN' },
    { title: 'Container Build', metrics: 'Distroless Multi-Stage', status: 'READY' },
    { title: 'Canary Deployment', metrics: '5% -> 25% -> 100%', status: 'ROUTING' },
    { title: 'Telemetry Traces', metrics: 'Otel Collector Live', status: 'ACTIVE' },
  ];

  return (
    <div className="w-full flex-1 border border-[#222222] bg-[#0d0d0d]/80 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs text-[#737373] border-b border-[#1f1f1f] pb-3">
        <span className="font-mono text-[#a3a3a3]">GITOPS_OBSERVABILITY_MATRIX</span>
        <span className="font-mono text-[11px] text-[#525252]">AUTOMATION: STRICT</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-auto py-8">
        {stages.map((st, i) => (
          <div
            key={i}
            className="p-4 rounded border border-[#262626] bg-[#141414] flex flex-col justify-between hover:border-[#444] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#666]">PHASE 0{i + 1}</span>
              <span className="text-[10px] font-mono text-white bg-[#222] px-1.5 py-0.5 rounded">
                {st.status}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#eaeaea] mb-1">{st.title}</div>
            <div className="text-xs text-[#777] font-mono">{st.metrics}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono border-t border-[#1f1f1f] pt-3">
        <span>ZERO DOWNTIME ROLLING DEPLOYMENT</span>
        <span>TARGET CONTAINER: #slide-content-6</span>
      </div>
    </div>
  );
};
