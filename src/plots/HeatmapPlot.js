// plots/HeatmapPlot.js
import { ResponsiveHeatMap } from "@nivo/heatmap";

const HeatmapPlot = ({ data, keys, indexBy }) => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveHeatMap
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
        forceSquare={true}
        axisTop={{ orient: "top", tickSize: 5, tickPadding: 5, tickRotation: -45 }}
        axisLeft={{ orient: "left", tickSize: 5, tickPadding: 5 }}
        colors={{ type: "diverging", scheme: "red_yellow_blue", divergeAt: 0.5 }}
        cellOpacity={1}
        cellBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
        labelTextColor={{ from: "color", modifiers: [["darker", 1.8]] }}
        animate={true}
        motionConfig="wobbly"
      />
    </div>
  );
};

export default HeatmapPlot;
