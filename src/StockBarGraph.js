// StockBarGraph.js
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import Papa from "papaparse";

const StockBarGraph = ({ updateDebugInfo, scene, camera, position, scale }) => {
  const graphRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch and parse CSV data
        const response = await fetch("/stock_dummy_data.csv");
        const csvText = await response.text();
        const { data: stockData } = Papa.parse(csvText, { header: true });

        updateDebugInfo(`Parsed ${stockData.length} rows of stock data for bar graph.\n`);

        // Create bar graph
        graphRef.current = createBarGraph(stockData);
        graphRef.current.position.set(position.x, position.y, position.z);
        graphRef.current.scale.set(scale.x, scale.y, scale.z);
        scene.add(graphRef.current);

        updateDebugInfo("Bar graph initialization complete.\n");
      } catch (error) {
        console.error("Error during bar graph initialization:", error);
        updateDebugInfo(`Error during bar graph initialization: ${error.message}\n`);
      }
    };

    const createBarGraph = (data) => {
      const group = new THREE.Group();

      const barWidth = 2;
      const barDepth = 2;
      const liftOffset = 0.1;  // Small offset to lift bars above the x-axis
      let validBars = 0;
      const maxClose = Math.max(...data.map((d) => parseFloat(d.close) || 0));
      const minClose = Math.min(...data.map((d) => parseFloat(d.close) || Infinity));
      const scale = 100 / (maxClose - minClose);

      data.forEach((d, index) => {
        const close = parseFloat(d.close);
        const open = parseFloat(d.open);
        if (!isNaN(close) && !isNaN(open)) {
          const barHeight = Math.max(0.1, (close - minClose) * scale);
          const barGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
          const color = close > open ? new THREE.Color(0x00ff00) : new THREE.Color(0xff0000);
          const barMaterial = new THREE.MeshPhongMaterial({
            color,
            shininess: 100,
            specular: 0x111111,
          });
          const bar = new THREE.Mesh(barGeometry, barMaterial);
          bar.position.set(index * (barWidth + 1), barHeight / 2 + liftOffset, 0);
          group.add(bar);

          // Add label
          const labelGeometry = new THREE.PlaneGeometry(2, 2);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font = '48px Arial';
          context.fillStyle = 'white';
          context.fillText(d.date, 0, 48);
          const texture = new THREE.CanvasTexture(canvas);
          const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
          });
          const label = new THREE.Mesh(labelGeometry, labelMaterial);
          label.rotation.x = -Math.PI / 2;
          label.position.set(index * (barWidth + 1), 0, barDepth / 2 + 1);
          group.add(label);

          validBars++;
        }
      });

      // Add axes
      const axisLength = Math.max(validBars * (barWidth + 1), 100);
      const axisColor = 0xffffff;
      const axisThickness = 0.5;

      const xAxis = new THREE.Mesh(
        new THREE.BoxGeometry(axisLength, axisThickness, axisThickness),
        new THREE.MeshBasicMaterial({ color: axisColor })
      );
      xAxis.position.set(axisLength / 2 - barWidth / 2, 0, 0);
      group.add(xAxis);

      const yAxis = new THREE.Mesh(
        new THREE.BoxGeometry(axisThickness, axisLength, axisThickness),
        new THREE.MeshBasicMaterial({ color: axisColor })
      );
      yAxis.position.set(-barWidth / 2, axisLength / 2, 0);
      group.add(yAxis);

      // Center the graph
      group.position.set(-axisLength / 2, 0, 0);

      return group;
    };

    init();

    return () => {
      if (graphRef.current) {
        scene.remove(graphRef.current);
        graphRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        });
      }
    };
  }, [updateDebugInfo, scene, position, scale]);

  return null;
};

export default StockBarGraph;