// plots/PiePlot.js
import { ResponsivePie } from "@nivo/pie";

const PiePlot = ({ data, theme }) => {
  // Debug log
  console.log('PiePlot received data:', data);

  // Add error boundary
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: theme === 'dark' ? '#ffffff' : '#333333'
      }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ height: "400px", minHeight: "400px", width: "100%" }}>
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 120, bottom: 80, left: 120 }}
        innerRadius={0.3}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ scheme: 'category10' }}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLabels={true}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        arcLabelsSkipAngle={10}
        enableArcLinkLabels={true}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={theme === 'dark' ? '#ffffff' : '#333333'}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        valueFormat={value => `${value} points`}
        legends={[
          {
            anchor: 'right',
            direction: 'column',
            justify: false,
            translateX: 60,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 10,
            itemTextColor: theme === 'dark' ? '#ffffff' : '#333333',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: theme === 'dark' ? '#cccccc' : '#666666'
                }
              }
            ]
          }
        ]}
      />
    </div>
  );
};

export default PiePlot;
