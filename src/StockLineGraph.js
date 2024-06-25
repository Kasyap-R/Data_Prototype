// StockLineGraph.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Papa from "papaparse";

const StockLineGraph = ({ updateDebugInfo, scene, camera, position, scale }) => {
  const graphRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch and parse data
        const response = await fetch("/stock_dummy_data.csv");
        const csvText = await response.text();
        const { data: stockData } = Papa.parse(csvText, { header: true });

        updateDebugInfo(`Parsed ${stockData.length} rows of stock data for line graph.\n`);

        // Create graph
        graphRef.current = createGraph(stockData);
        graphRef.current.position.set(position.x, position.y, position.z);
        graphRef.current.scale.set(scale.x, scale.y, scale.z);
        scene.add(graphRef.current);

        updateDebugInfo("3D Line Graph initialization complete.\n");
      } catch (error) {
        console.error("Error during line graph initialization:", error);
        updateDebugInfo(`Error during line graph initialization: ${error.message}\n`);
      }
    };

    const createGraph = (data) => {
      const group = new THREE.Group();
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const geometry = new THREE.BufferGeometry();

      const positions = [];
      const colors = [];
      const color = new THREE.Color();

      const xScale = 180 / (data.length - 1);
      const yScale = 100 / (Math.max(...data.map(d => parseFloat(d.close))) - Math.min(...data.map(d => parseFloat(d.close))));

      data.forEach((d, i) => {
        const x = i * xScale - 90;
        const y = (parseFloat(d.close) - Math.min(...data.map(d => parseFloat(d.close)))) * yScale;
        const z = 0;

        positions.push(x, y, z);

        // Color gradient based on price change
        if (i > 0) {
          const change = parseFloat(d.close) - parseFloat(data[i - 1].close);
          color.setHSL(change > 0 ? 0.3 : 0, 1, 0.5);
        } else {
          color.setHSL(0.3, 1, 0.5);
        }
        colors.push(color.r, color.g, color.b);

        // Add sphere at data point
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: color });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x, y, z);
        group.add(sphere);

        // Add vertical line
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0, z),
          new THREE.Vector3(x, y, z)
        ]);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: color }));
        group.add(line);
      });

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const line = new THREE.Line(geometry, material);
      group.add(line);

      // Add axes
      const axisLength = 200;
      const axisColor = 0xffffff;
      const axisThickness = 0.5;

      const xAxis = new THREE.Mesh(
        new THREE.BoxGeometry(axisLength, axisThickness, axisThickness),
        new THREE.MeshBasicMaterial({ color: axisColor })
      );
      xAxis.position.set(0, 0, 0);
      group.add(xAxis);

      const yAxis = new THREE.Mesh(
        new THREE.BoxGeometry(axisThickness, axisLength, axisThickness),
        new THREE.MeshBasicMaterial({ color: axisColor })
      );
      yAxis.position.set(-axisLength / 2, axisLength / 2, 0);
      group.add(yAxis);

      return group;
    };

    init();

    return () => {
      if (graphRef.current) {
        scene.remove(graphRef.current);
        graphRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) object.material.dispose();
        });
      }
    };
  }, [updateDebugInfo, scene, position, scale]);

  return null;
};

export default StockLineGraph;