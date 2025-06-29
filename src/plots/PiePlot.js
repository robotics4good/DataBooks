// plots/PiePlot.js
import React, { useState } from 'react';
import { ResponsivePie } from "@nivo/pie";

const studentData = [
  { id: 'Healthy', label: 'Healthy', value: 10 },
  { id: 'Infected', label: 'Infected', value: 5 },
];

const tableData = [
  { id: 'Uninfected', label: 'Uninfected', value: 4 },
  { id: 'Partially Infected', label: 'Partially Infected', value: 3 },
  { id: 'Infected', label: 'Infected', value: 2 },
];

const PiePlot = ({ theme, logAction }) => {
  const [variable, setVariable] = useState('Infected Students');

  const handleVariableChange = (newVar) => {
    setVariable(newVar);
    if (logAction) logAction(`Pie Plot variable set to: ${newVar}`);
  };

  const data = variable === 'Infected Students' ? studentData : tableData;

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
      {/* Variable selection section integrated with main plot UI */}
      <div style={{
        margin: '0 0 1.2rem 0',
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Variable:</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <label style={{ fontWeight: 600 }}>
            <input
              type="radio"
              name="pie-variable"
              value="Infected Students"
              checked={variable === 'Infected Students'}
              onChange={() => handleVariableChange('Infected Students')}
              style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
            />
            Infected Students
          </label>
          <label style={{ fontWeight: 600 }}>
            <input
              type="radio"
              name="pie-variable"
              value="Infected Tables"
              checked={variable === 'Infected Tables'}
              onChange={() => handleVariableChange('Infected Tables')}
              style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
            />
            Infected Tables
          </label>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ height: 320, width: 420, minWidth: 320 }}>
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 60, bottom: 60, left: 60 }}
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
            valueFormat={value => `${value} students/tables`}
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
      </div>
    </div>
  );
};

export default PiePlot;
