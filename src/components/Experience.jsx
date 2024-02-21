import { Float, PerspectiveCamera, useScroll} from "@react-three/drei";
import { gsap } from "gsap";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Background } from "./Background";
import { Airplane } from "./Airplane";
import { Cloud } from "./Cloud";
import * as THREE from "three";
import { TextSection } from "./TextSection";

const LINE_NB_POINTS = 1000;
const CURVE_DISTANCE = 250;
const CURVE_AHEAD_CAMERA = 0.008;
const CURVE_AHEAD_AIRPLANE = 0.02;
const AIRPLANE_MAX_ANGLE = 35;
const FRICTION_DISTANCE = 42;

export const Experience = () => {

  const curvePoints = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -CURVE_DISTANCE),
      new THREE.Vector3(100, 0, -2 * CURVE_DISTANCE),
      new THREE.Vector3(-100, 0, -3 * CURVE_DISTANCE),
      new THREE.Vector3(100, 0, -4 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -5 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -6 * CURVE_DISTANCE),
      new THREE.Vector3(0, 0, -7 * CURVE_DISTANCE),
    ],
    []
  );

  const sceneOpacity = useRef(0);
  const lineMaterialRef = useRef();

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(curvePoints,  false,"catmullrom",0.5);
  }, []);

  const textSections = useMemo(() => {
    return [
      {
        cameraRailDist: -1,
        position: new THREE.Vector3(
          curvePoints[1].x - 3,
          curvePoints[1].y,
          curvePoints[1].z
        ),
        subtitle: `Welcome to Wawatmos,
Have a seat and enjoy the ride!`,
      },
      {
        cameraRailDist: 1.5,
        position: new THREE.Vector3(
          curvePoints[2].x + 2,
          curvePoints[2].y,
          curvePoints[2].z
        ),
        title: "Services",
        subtitle: `Do you want a drink?
We have a wide range of beverages!`,
      },
      {
        cameraRailDist: -1,
        position: new THREE.Vector3(
          curvePoints[3].x - 3,
          curvePoints[3].y,
          curvePoints[3].z
        ),
        title: "Fear of flying?",
        subtitle: `Our flight attendants will help you have a great journey`,
      },
      {
        cameraRailDist: 1.5,
        position: new THREE.Vector3(
          curvePoints[4].x + 3.5,
          curvePoints[4].y,
          curvePoints[4].z - 12
        ),
        title: "Movies",
        subtitle: `We provide a large selection of medias, we highly recommend you Porco Rosso during the flight`,
      },
  ]
  }, []);

  const shape = useMemo( () => {
    const shape = new THREE.Shape();
    shape.moveTo(0,-0.08);
    shape.lineTo(0,0.08);

    return shape;
  },[curve]);

  const cameraGroup = useRef();
  const cameraRail = useRef();
  const camera = useRef();
  const scroll = useScroll();
  const lastScroll = useRef(0);

  //const { play, setHasScroll, end, setEnd } = usePlay();

  useFrame((_state, delta) => {
    const scrollOffset = Math.max(0, scroll.offset);

    let friction = 1;
    let resetCameraRail = true;
    // LOOK TOO CLOSE TEXT SECTIONS
    textSections.forEach((textSection) => {
      const distance = textSection.position.distanceTo(cameraGroup.current.position);

      if (distance < FRICTION_DISTANCE) {
        friction = Math.max(distance / FRICTION_DISTANCE, 0.1);
        const targetCameraRailPosition = new THREE.Vector3(
          (1 - distance / FRICTION_DISTANCE) * textSection.cameraRailDist,
          0,
          0,
        );
        cameraRail.current.position.lerp(targetCameraRailPosition, delta);
        resetCameraRail = false;
      }
    });
    if (resetCameraRail) {
      const targetCameraRailPosition = new THREE.Vector3(0,0,0);
      cameraRail.current.position.lerp(targetCameraRailPosition, delta);
    }

    // CALCULATE LERPED SCROLL OFFSET
    let lerpedScrollOffset = THREE.MathUtils.lerp(
      lastScroll.current, 
      scrollOffset, 
      delta * friction
    );

    // PROTECT BELOW 0 AND ABOVE 1
    lerpedScrollOffset = Math.min(lerpedScrollOffset, 1);
    lerpedScrollOffset = Math.max(lerpedScrollOffset, 0);

    lastScroll.current = lerpedScrollOffset;
    tl.current.seek(lerpedScrollOffset * tl.current.duration());

    const curPoint = curve.getPoint(lerpedScrollOffset);

    // Follow the curve points
    cameraGroup.current.position.lerp(curPoint, delta * 24);

    // Make the group look ahead on the curve
    
    const lookAtPoint = curve.getPoint(
      Math.min(scrollOffset + CURVE_AHEAD_CAMERA, 1)
    );

    const currentLookAt = cameraGroup.current.getWorldDirection(
      new THREE.Vector3()
    );
    const targetLookAt = new THREE.Vector3()
      .subVectors(curPoint, lookAtPoint)
      .normalize();

    const lookAt = currentLookAt.lerp(targetLookAt, delta * 24);
    cameraGroup.current.lookAt(
      cameraGroup.current.position.clone().add(lookAt)
    );

    //Airplane rotation

    const tangent = curve.getTangent(lerpedScrollOffset + CURVE_AHEAD_AIRPLANE);
    
    const nonLerpLookAt = new THREE.Group();
    nonLerpLookAt.position.copy(curPoint);
    nonLerpLookAt.lookAt(nonLerpLookAt.position.clone().add(targetLookAt));

    tangent.applyAxisAngle(
      new THREE.Vector3(0,1,0),
      -nonLerpLookAt.rotation.y
    )


    
    let angle = Math.atan2(-tangent.z, tangent.x);
    angle = -Math.PI /2 + angle;

    let angleDegrees = (angle * 180) / Math.PI;
    angleDegrees *= 2.4;

    // LIMIT PLANE ANGLE
    if (angleDegrees < 0) {
      angleDegrees = Math.max(angleDegrees, -AIRPLANE_MAX_ANGLE);
    }
    if (angleDegrees > 0) {
      angleDegrees = Math.max(angleDegrees, AIRPLANE_MAX_ANGLE);
    }

    // Convert angle back to radiance
    angle = (angleDegrees * Math.PI) / 180;

    const targetAirplaneQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        airplane.current.rotation.x,
        airplane.current.rotation.y,
        angle
      )
    );
    airplane.current.quaternion.slerp(targetAirplaneQuaternion, delta *2);
  });


  // END of useFrame
  const airplane = useRef();
  const tl = useRef();
  const backgroundColors = useRef({
    colorA: "#3535cc",
    colorB: "#abaadd",
  });

  useLayoutEffect(() => {
    tl.current = gsap.timeline();

    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#6f35cc",
      colorB: "#ffad30",
    });

    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#424242",
      colorB: "#ffcc00",
    });

    tl.current.to(backgroundColors.current, {
      duration: 1,
      colorA: "#81318b",
      colorB: "#55ab8f",
    });

    tl.current.pause();
  },[]);

  return (
    <>
      <directionalLight position={[0, 3, 1]} intensity={0.1} />
      {/* <OrbitControls enableZoom={false} /> */}
      <group ref={cameraGroup}>
        <Background backgroundColors={backgroundColors} />
        <group ref={cameraRail}>
          <PerspectiveCamera position={[0,0,5]} fov={30} makeDefault />
        </group>
        <group ref={airplane}>
          <Float floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
            <Airplane
              rotation-y={Math.PI / 2}
              scale={[0.2,0.2,0.2]}
              position-y={0.1} 
            />
          </Float>
        </group>
      </group>

      {/* TEXT */ }
      {
        textSections.map((textSection, index) => (
          <TextSection {...textSection} key={index} />    
        ))
      }

      {/* LINE */ }
      <group position-y={-2}>
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
        <meshStandardMaterial 
          color={"white"} 
          opacity={1} 
          transparent
          envMapIntensity={2} 
        />
      </mesh>
      </group>



      <Cloud opacity={1} scale={[1,1,1.5]} position={[-3.5,-1.2,-7]} />
      <Cloud opacity={1} scale={[1,1,2]} position={[3.5,-1,-10]} rotation-y={Math.PI} />
      <Cloud opacity={1} scale={[1,1,1]} position={[-3.5,0.2,-12]} rotation-y={Math.PI / 3} />
      <Cloud opacity={1} scale={[1,1,1]} position={[3.5,0.2,-12]} />
      <Cloud opacity={1} scale={[0.4,0.4,0.4]} position={[1,-0.2,-12]} rotation-y={Math.PI / 9}/>
      <Cloud opacity={1} scale={[0.3,0.5,2]} position={[-4,-0.5,-53]} />
      <Cloud opacity={1} scale={[0.8,0.8,0.8]} position={[-1,-1.5,-100]} />
    </>
  );
};
