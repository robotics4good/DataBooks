// plots/BarPlot.js
import { ResponsiveBar } from "@nivo/bar";

const BarPlot = ({ data, keys, indexBy }) => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={{ scheme: "nivo" }}
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisBottom={{ legend: indexBy, legendPosition: "middle", legendOffset: 32 }}
        axisLeft={{ legend: "Value", legendPosition: "middle", legendOffset: -40 }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        animate={true}
        role="application"
        ariaLabel="Nivo bar chart demo"
      />
    </div>
  );
};

export default BarPlot;
