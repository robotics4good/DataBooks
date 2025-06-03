// plots/line_plot.js
import { ResponsiveLine } from "@nivo/line";

const LinePlot = ({ data }) => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: 100 }}
        axisBottom={{ legend: "Time", legendOffset: 36, legendPosition: "middle" }}
        axisLeft={{ legend: "Value", legendOffset: -40, legendPosition: "middle" }}
        colors={{ scheme: "category10" }}
        pointSize={10}
        pointBorderWidth={2}
        useMesh={true}
      />
    </div>
  );
};

export default LinePlot;
