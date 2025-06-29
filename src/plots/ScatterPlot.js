import React from 'react';
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

const sampleData = [
  {
    id: 'Group A',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 15 },
      { x: 3, y: 12 },
      { x: 4, y: 18 },
    ],
  },
  {
    id: 'Group B',
    data: [
      { x: 1, y: 7 },
      { x: 2, y: 11 },
      { x: 3, y: 9 },
      { x: 4, y: 14 },
    ],
  },
];

const ScatterPlot = ({ data = sampleData, theme }) => {
  const nivoTheme = {
    grid: {
      line: {
        stroke: (theme === 'unity' || theme === 'light') ? '#d3d3d3' : '#555555',
        strokeWidth: 1,
      },
    },
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveScatterPlot
        data={data}
        margin={{ top: 60, right: 90, bottom: 90, left: 90 }}
        xScale={{ type: "linear", min: 0, max: 5 }}
        yScale={{ type: "linear", min: 0, max: 20 }}
        axisBottom={{
          legend: 'X',
          legendOffset: 56,
          legendPosition: 'middle',
          tickRotation: -45,
        }}
        axisLeft={{ legend: 'Y', legendOffset: -60 }}
        legends={[
            {
                anchor: 'bottom-right',
                direction: 'column',
                translateX: 80,
                itemWidth: 100,
                itemHeight: 16,
                itemsSpacing: 3,
                symbolShape: 'circle'
            }
        ]}
        theme={nivoTheme}
        animate={false}
        motionConfig={{
          mass: 1,
          tension: 120,
          friction: 26,
          clamp: false,
          precision: 0.01,
          velocity: 0,
        }}
      />
    </div>
  );
};

export default ScatterPlot; 