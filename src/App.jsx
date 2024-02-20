import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { ScrollControls } from "@react-three/drei";

function App() {
  return (
    <>
      <Canvas camera={{
        position: [0, 0, 5],
        fov: 30,
      }}>
        <color attach="background" args={["#ececec"]} />
        <ScrollControls pages={5} damping={0.3} >
          <Experience />
        </ScrollControls>
      </Canvas>
    </>
  );
}

export default App;
