// App.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import StockBarGraph from "./StockBarGraph";
import StockLineGraph from "./StockLineGraph";
import PlayerControls from "./PlayerControls";

const App = () => {
  const [debugInfo, setDebugInfo] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const [sceneInitialized, setSceneInitialized] = useState(false);

  useEffect(() => {
    // Initialize scene, camera, and renderer
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x000000);

    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(0, 50, 100);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(rendererRef.current.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    sceneRef.current.add(ground);

    setSceneInitialized(true);

    // Handle window resize
    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.removeChild(rendererRef.current.domElement);
    };
  }, []);

  const updateDebugInfo = useCallback((info) => {
    setDebugInfo((prev) => prev + info);
  }, []);

  const handleLock = useCallback((locked) => {
    setIsLocked(locked);
  }, []);

  const handleStartClick = useCallback(() => {
    document.body.requestPointerLock();
  }, []);

  return (
    <div className="App">
      {sceneInitialized && (
        <>
          <StockBarGraph
            updateDebugInfo={updateDebugInfo}
            scene={sceneRef.current}
            camera={cameraRef.current}
            position={new THREE.Vector3(-100, 0, 0)}
            scale={new THREE.Vector3(1, 1, 1)}
          />
          <StockLineGraph
            updateDebugInfo={updateDebugInfo}
            scene={sceneRef.current}
            camera={cameraRef.current}
            position={new THREE.Vector3(100, 0, 0)}
            scale={new THREE.Vector3(1, 1, 1)}
          />
          <PlayerControls
            camera={cameraRef.current}
            domElement={document.body}
            onLock={handleLock}
            updateDebugInfo={updateDebugInfo}
          />
        </>
      )}
      <div
        id="blocker"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          top: 0,
          left: 0,
          display: isLocked ? "none" : "block",
          zIndex: 2000,
        }}
      >
        <div
          id="instructions"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontSize: "14px",
            cursor: "pointer",
            color: "#ffffff",
          }}
          onClick={handleStartClick}
          role="button"
          tabIndex={0}
        >
          <p style={{ fontSize: "36px" }}>Click to play</p>
          <p>
            Move: WASD
            <br />
            Jump: SPACE
            <br />
            Look: MOUSE
          </p>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "10px",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          zIndex: 1000,
          maxHeight: "300px",
          overflowY: "auto",
          width: "300px",
        }}
      >
        {debugInfo}
      </div>
    </div>
  );
};

export default App;
