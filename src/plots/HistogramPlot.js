import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

const sampleData = [
  { category: 'Table 1', Frequency: 5 },
  { category: 'Table 2', Frequency: 8 },
  { category: 'Table 3', Frequency: 3 },
  { category: 'Table 4', Frequency: 7 },
];

const HistogramPlot = ({ data = sampleData }) => (
  <div style={{ height: '100%', width: '100%' }}>
    <ResponsiveBar
      data={data}
      keys={['Frequency']}
      indexBy="category"
      margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'nivo' }}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisBottom={{ legend: 'Category', legendPosition: 'middle', legendOffset: 32 }}
      axisLeft={{ legend: 'Frequency', legendPosition: 'middle', legendOffset: -40 }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      animate={true}
      role="application"
      ariaLabel="Nivo histogram demo"
    />
  </div>
);

export default HistogramPlot; 