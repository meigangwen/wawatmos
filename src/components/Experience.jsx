import { Float, OrbitControls, PerspectiveCamera, useScroll} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Background } from "./Background";
import { Airplane } from "./Airplane";
import { Cloud } from "./Cloud";
import * as THREE from "three";

export const Experience = () => {
  const LINE_NB_POINTS = 2000;
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(0,0,-10),
      new THREE.Vector3(-2,0,-20),
      new THREE.Vector3(-3,0,-30),
      new THREE.Vector3(0,0,-40),
      new THREE.Vector3(5,0,-50),
      new THREE.Vector3(7,0,-60),
      new THREE.Vector3(5,0,-70),
      new THREE.Vector3(0,0,-80),
      new THREE.Vector3(0,0,-90),
      new THREE.Vector3(0,0,-100),
    ],
    false,
    "catmullrom",
    0.5);
  }, []);

  const linePoints = useMemo( () => {
    return curve.getPoints(LINE_NB_POINTS);
  },[curve]);

  const shape = useMemo( () => {
    const shape = new THREE.Shape();
    shape.moveTo(0,-0.2);
    shape.lineTo(0,0.2);

    return shape;
  },[curve]);

  const cameraGroup = useRef();
  const scroll = useScroll();

  useFrame((_state, delta) => {
    const curPointIndex = Math.min(
      Math.round(scroll.offset * linePoints.length),
      linePoints.length - 1
    );
    const curPoint = linePoints[curPointIndex];
    cameraGroup.current.position.lerp(curPoint, delta * 24);
  });

  return (
    <>
      {/* <OrbitControls enableZoom={false} /> */}
      <group ref={cameraGroup}>
        <Background />
        <PerspectiveCamera position={[0,0,5]} fov={30} makeDefault />
        <Float floatIntensity={2} speed={2}>
          <Airplane
            rotation-y={Math.PI / 2}
            scale={[0.2,0.2,0.2]}
            position-y={0.1} 
          />
        </Float>
      </group>

      {/* LINE */ }
      <group position-y={-2}>
      { 
        /*<Line
          points = {linePoints}
          color = {"white"}
          opacity = {0.7} 
          transparent
          lineWidth={16}
        />*/
      }
      <mesh>
        <extrudeGeometry
        args={[
          shape,
          {
            steps: LINE_NB_POINTS,
            bevelEnabled: false,
            extrudePath: curve,
          }
        ]} 
        />
        <meshStandardMaterial color={"white"} opacity={0.7} transparent />
      </mesh>
      </group>



      <Cloud opacity={0.5} scale={[0.3,0.3,0.3]} position={[-2,1,-3]} />
      <Cloud opacity={0.5} scale={[0.2,0.3,0.4]} position={[1.5,-0.5,-2]} />
      <Cloud opacity={0.7} scale={[0.3,0.3,0.4]} position={[2,-0.2,-2]} rotation-y={Math.PI / 9} />
      <Cloud opacity={0.7} scale={[0.4,0.4,0.4]} position={[1,-0.2,-12]} rotation-y={Math.PI / 9} />
      <Cloud opacity={0.7} scale={[0.5,0.5,0.5]} position={[-1,1,-53]} />
      <Cloud opacity={0.3} scale={[0.8,0.8,0.8]} position={[0,1,-100]} />
    </>
  );
};
