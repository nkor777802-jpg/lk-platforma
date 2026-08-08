import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { brandColors } from "@/lib/brand";

export type ModelLayer = {
  code: string;
  name: string;
  visualType: string;
  description?: string | null;
  materialName?: string | null;
};

export type ModelOptions = {
  exploded: boolean;
  section: boolean;
  transparent: boolean;
  hidden: string[];
};

/** Цвет слоя берётся из фирменной палитры (единый источник — brand.ts). */
export function layerColor(visualType: string) {
  switch (visualType) {
    case "conductor":
      return brandColors.orange.hex;
    case "stranded":
      return brandColors.orangeLight.hex;
    case "insulation":
      return brandColors.teal.hex;
    case "screen":
      return brandColors.tealDark.hex;
    case "armour":
      return brandColors.gray.hex;
    case "sheath":
      return brandColors.blue.hex;
    default:
      return brandColors.blueLight.hex;
  }
}

const LENGTH = 5;

export default function CableModel3D({
  layers,
  visibleCount,
  options,
}: {
  layers: ModelLayer[];
  visibleCount: number;
  options: ModelOptions;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const stateRef = useRef({ layers, visibleCount, options });
  stateRef.current = { layers, visibleCount, options };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(6, 4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 24;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-6, -3, -5);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const resize = () => {
      const width = mount.clientWidth || 480;
      const height = mount.clientHeight || 360;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      groupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    for (const child of [...group.children]) {
      group.remove(child);
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose?.();
      });
    }

    const clipping = options.section ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)] : [];
    const shown = layers.slice(0, Math.max(visibleCount, 0));

    shown.forEach((layer, index) => {
      if (options.hidden.includes(layer.code)) return;
      const radius = 0.3 + index * 0.22;
      const color = new THREE.Color(layerColor(layer.visualType));
      const isOuter = index === shown.length - 1;
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: layer.visualType === "conductor" || layer.visualType === "armour" ? 0.7 : 0.15,
        roughness: layer.visualType === "sheath" ? 0.65 : 0.4,
        transparent: options.transparent && !isOuter ? false : options.transparent,
        opacity: options.transparent && !isOuter ? 1 : options.transparent ? 0.35 : 1,
        side: THREE.DoubleSide,
        clippingPlanes: clipping,
        clipShadows: true,
      });

      const node = new THREE.Group();
      if (layer.visualType === "stranded") {
        const wireRadius = radius * 0.32;
        for (let i = 0; i < 6; i += 1) {
          const angle = (i / 6) * Math.PI * 2;
          const wire = new THREE.Mesh(
            new THREE.CylinderGeometry(wireRadius, wireRadius, LENGTH, 20, 1),
            material,
          );
          wire.rotation.z = Math.PI / 2;
          wire.position.y = Math.cos(angle) * (radius - wireRadius);
          wire.position.z = Math.sin(angle) * (radius - wireRadius);
          node.add(wire);
        }
        const core = new THREE.Mesh(
          new THREE.CylinderGeometry(wireRadius, wireRadius, LENGTH, 20, 1),
          material,
        );
        core.rotation.z = Math.PI / 2;
        node.add(core);
      } else if (layer.visualType === "armour") {
        const tape = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, LENGTH, 8, 1, true),
          material,
        );
        tape.rotation.z = Math.PI / 2;
        node.add(tape);
      } else {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, LENGTH, 48, 1, index > 0),
          material,
        );
        body.rotation.z = Math.PI / 2;
        node.add(body);
      }

      if (options.exploded) node.position.x = (index - (shown.length - 1) / 2) * 1.6;
      group.add(node);
    });
  }, [layers, visibleCount, options]);

  return <div ref={mountRef} className="h-[320px] w-full sm:h-[420px]" />;
}
