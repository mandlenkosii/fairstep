"use client";

import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * FairStep's idea as an object: six paper slabs rising like stairs. An ochre
 * marker climbs one step at a time and every step it passes turns teal, the
 * way a fair case moves from incident to outcome. Decorative only.
 */

const STEPS = 6;
const PAPER = new THREE.Color("#fbf7ef");
const TEAL = new THREE.Color("#0e5e5a");
const TEAL_SOFT = new THREE.Color("#3f8f88");
const OCHRE = "#c9861a";
/** Seconds the marker spends on each step (hop + rest). */
const STEP_SECONDS = 1.15;

function stepPosition(i: number): [number, number, number] {
  // Centred on the origin: each step is further right, higher and a little further back.
  return [(i - 2.5) * 0.78, (i - 2.5) * 0.5, -(i - 2.5) * 0.3];
}

function Stairs({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const materials = useRef<THREE.MeshStandardMaterial[]>([]);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    // Gentle tilt towards the pointer.
    if (group.current) {
      const { x, y } = state.pointer;
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        -0.55 + x * 0.2,
        3,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        0.12 - y * 0.08,
        3,
        delta,
      );
    }

    // Where the marker is: a whole step plus how far through the hop it is.
    const cycle = STEPS + 1.5; // a pause at the top before starting again
    const t = still ? 2 : (state.clock.elapsedTime / STEP_SECONDS) % cycle;
    const index = Math.min(Math.floor(t), STEPS - 1);
    const hop = still ? 0 : Math.min(1, (t - Math.floor(t)) / 0.45);

    if (marker.current) {
      const from = stepPosition(index);
      const to = stepPosition(Math.min(index + 1, STEPS - 1));
      const moving = t < STEPS - 1;
      const k = moving ? THREE.MathUtils.smootherstep(hop, 0, 1) : 0;
      marker.current.position.set(
        THREE.MathUtils.lerp(from[0], to[0], k),
        THREE.MathUtils.lerp(from[1], to[1], k) + 0.46 + Math.sin(k * Math.PI) * 0.6,
        THREE.MathUtils.lerp(from[2], to[2], k),
      );
    }

    // Steps behind the marker are "done" (teal); the current one is soft teal.
    materials.current.forEach((material, i) => {
      if (!material) return;
      target.copy(i < index ? TEAL : i === index ? TEAL_SOFT : PAPER);
      material.color.lerp(target, still ? 1 : Math.min(1, delta * 4));
    });
  });

  return (
    <group ref={group} position={[-0.45, -0.15, 0]} scale={0.86}>
      {Array.from({ length: STEPS }, (_, i) => (
        <RoundedBox
          key={i}
          args={[1.18, 0.5, 1.25]}
          radius={0.09}
          smoothness={4}
          position={stepPosition(i)}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            ref={(m) => {
              if (m) materials.current[i] = m;
            }}
            color={PAPER}
            roughness={0.62}
            metalness={0.04}
          />
        </RoundedBox>
      ))}
      <mesh ref={marker} castShadow>
        <sphereGeometry args={[0.21, 48, 48]} />
        <meshStandardMaterial color={OCHRE} roughness={0.3} metalness={0.25} />
      </mesh>
    </group>
  );
}

export default function StepsScene({ still = false }: { still?: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={still ? "demand" : "always"}
      camera={{ position: [0.6, 1.6, 9.2], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden
    >
      <ambientLight intensity={0.95} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-6, 2, -2]} intensity={0.35} color="#ffe6bf" />
      <Stairs still={still} />
      <ContactShadows position={[0, -1.75, 0]} opacity={0.32} scale={12} blur={2.6} far={4} />
    </Canvas>
  );
}
