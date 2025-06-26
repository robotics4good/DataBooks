import { ResponsiveScatterPlot } from "@nivo/scatterplot";

const ScatterPlot = ({ data, theme }) => {
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
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: 100 }}
        axisBottom={{
          legend: 'Time',
          legendOffset: 56,
          legendPosition: 'middle',
          tickRotation: -45,
        }}
        axisLeft={{ legend: 'Value', legendOffset: -60 }}
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