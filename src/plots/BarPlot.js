// plots/BarPlot.js
import React from 'react';
import { ResponsiveBar } from "@nivo/bar";

// Example placeholder data
const sampleData = [
  { country: 'USA', apples: 120, bananas: 80, cherries: 50 },
  { country: 'UK', apples: 90, bananas: 60, cherries: 40 },
  { country: 'France', apples: 100, bananas: 70, cherries: 60 },
];

const BarPlot = ({ data = sampleData }) => (
  <div style={{ height: "100%", width: "100%" }}>
    <ResponsiveBar
      data={data}
      keys={['apples', 'bananas', 'cherries']}
      indexBy="country"
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "nivo" }}
      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      axisBottom={{ legend: "country (indexBy)", legendOffset: 32, legendPosition: "middle" }}
      axisLeft={{ legend: "food", legendOffset: -40, legendPosition: "middle" }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "column",
          translateX: 120,
          itemsSpacing: 3,
          itemWidth: 100,
          itemHeight: 16,
          symbolShape: "circle",
        },
      ]}
      animate={true}
      role="application"
      ariaLabel="Nivo bar chart demo"
    />
  </div>
);

export default BarPlot;
