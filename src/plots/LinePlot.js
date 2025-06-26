// plots/line_plot.js
import { ResponsiveLine } from "@nivo/line";

const LinePlot = ({ data, theme }) => {
  const nivoTheme = {
    axis: {
      domain: {
        line: {
          stroke: (theme === 'dark') ? '#ffffff' : '#000000',
        },
      },
      ticks: {
        line: {
          stroke: (theme === 'dark') ? '#ffffff' : '#000000',
        },
        text: {
          fill: (theme === 'dark') ? '#ffffff' : '#000000',
        },
      },
      legend: {
        text: {
          fill: (theme === 'dark') ? '#ffffff' : '#000000',
        },
      },
    },
    grid: {
      line: {
        stroke: theme === 'dark' ? '#555555' : '#d3d3d3',
        strokeWidth: 1,
      },
    },
  };
  
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 60, right: 90, bottom: 90, left: 90 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: 100 }}
        axisBottom={{
          legend: "Time",
          legendOffset: 56,
          legendPosition: "middle",
          tickRotation: -45,
        }}
        axisLeft={{ legend: "Value", legendOffset: -60, legendPosition: "middle" }}
        colors={{ scheme: "category10" }}
        pointSize={10}
        pointBorderWidth={2}
        useMesh={true}
        animate={false}
        motionConfig={{
          mass: 1,
          tension: 120,
          friction: 26,
          clamp: false,
          precision: 0.01,
          velocity: 0,
        }}
        theme={nivoTheme}
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
      />
    </div>
  );
};

export default LinePlot;
