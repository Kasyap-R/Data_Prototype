// PlayerControls.js
import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

const PlayerControls = ({ camera, domElement, onLock, updateDebugInfo }) => {
  const controlsRef = useRef(null);
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const canJump = useRef(false);

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  const onKeyDown = useCallback((event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward.current = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft.current = true;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward.current = true;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight.current = true;
        break;
      case "Space":
        if (canJump.current) velocity.current.y += 350;
        canJump.current = false;
        break;
    }
  }, []);

  const onKeyUp = useCallback((event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward.current = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft.current = false;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward.current = false;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight.current = false;
        break;
    }
  }, []);

  useEffect(() => {
    if (!camera) {
      updateDebugInfo("Camera not initialized. PlayerControls waiting...\n");
      return;
    }

    controlsRef.current = new PointerLockControls(camera, domElement);
    controlsRef.current.addEventListener("lock", () => onLock(true));
    controlsRef.current.addEventListener("unlock", () => onLock(false));

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    updateDebugInfo("Player controls initialized.\n");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      controlsRef.current.removeEventListener("lock", () => onLock(true));
      controlsRef.current.removeEventListener("unlock", () => onLock(false));
    };
  }, [camera, domElement, onLock, onKeyDown, onKeyUp, updateDebugInfo]);

  useEffect(() => {
    if (!controlsRef.current) return;

    let animationFrameId;
    let prevTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current.isLocked === true) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.current.x -= velocity.current.x * 10.0 * delta;
        velocity.current.z -= velocity.current.z * 10.0 * delta;
        velocity.current.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
        direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
        direction.current.normalize();

        if (moveForward.current || moveBackward.current)
          velocity.current.z -= direction.current.z * 400.0 * delta;
        if (moveLeft.current || moveRight.current)
          velocity.current.x -= direction.current.x * 400.0 * delta;

        controlsRef.current.moveRight(-velocity.current.x * delta);
        controlsRef.current.moveForward(-velocity.current.z * delta);

        controlsRef.current.getObject().position.y += velocity.current.y * delta;

        if (controlsRef.current.getObject().position.y < 10) {
          velocity.current.y = 0;
          controlsRef.current.getObject().position.y = 10;
          canJump.current = true;
        }

        prevTime = time;
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PlayerControls;