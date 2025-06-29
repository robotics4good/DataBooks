import React, { useState } from 'react';
import LinePlot from './LinePlot';
import ScatterPlot from './ScatterPlot';
import BarPlot from './BarPlot';
import HistogramPlot from './HistogramPlot';
import PiePlot from './PiePlot';
// Import other plot components as needed

// Modular config for each plot type
const plotConfigs = {
  line: {
    label: 'Line Plot',
    allowedMatrix: {
      "Time": {
        "Time": false,
        "Tasks Completed": true,
        "Meetings Held": true,
        "Table Infections": true,
        "Student Infections": true
      },
      "Tasks Completed": {
        "Time": true,
        "Tasks Completed": false,
        "Meetings Held": false,
        "Table Infections": true,
        "Student Infections": true
      },
      "Meetings Held": {
        "Time": true,
        "Tasks Completed": true,
        "Meetings Held": false,
        "Table Infections": true,
        "Student Infections": true
      },
      "Table Infections": {
        "Time": false,
        "Tasks Completed": false,
        "Meetings Held": false,
        "Table Infections": false,
        "Student Infections": false
      },
      "Student Infections": {
        "Time": false,
        "Tasks Completed": false,
        "Meetings Held": false,
        "Table Infections": false,
        "Student Infections": false
      }
    },
    variables: ["Time", "Tasks Completed", "Meetings Held", "Table Infections", "Student Infections"],
    component: LinePlot,
  },
  scatter: {
    label: 'Scatter Plot',
    allowedMatrix: {
      "Time":              { "Time": false, "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
      "Tasks Completed":   { "Time": true,  "Tasks Completed": false, "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
      "Meetings Held":     { "Time": true,  "Tasks Completed": true,  "Meetings Held": false, "Table Infections": true,  "Student Infections": true },
      "Table Infections":  { "Time": true,  "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": false, "Student Infections": true },
      "Student Infections":{ "Time": true,  "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": true,  "Student Infections": false },
    },
    variables: ["Time", "Tasks Completed", "Meetings Held", "Table Infections", "Student Infections"],
    component: ScatterPlot,
  },
  bar: {
    label: 'Bar Plot',
    allowedMatrix: {
      "Time":              { "Time": false, "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
      "Tasks Completed":   { "Time": false, "Tasks Completed": false, "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
      "Meetings Held":     { "Time": false, "Tasks Completed": true,  "Meetings Held": false, "Table Infections": true,  "Student Infections": true },
      "Table Infections":  { "Time": false, "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": false, "Student Infections": true },
      "Student Infections":{ "Time": false, "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": true,  "Student Infections": false },
    },
    variables: ["Time", "Tasks Completed", "Meetings Held", "Table Infections", "Student Infections"],
    component: BarPlot,
  },
  histogram: {
    label: 'Histogram Plot',
    allowedMatrix: {
      "Time":              { "Frequency": false },
      "Tasks Completed":   { "Frequency": false },
      "Meetings Held":     { "Frequency": false },
      "Table Infections":  { "Frequency": true },
      "Student Infections":{ "Frequency": true },
    },
    variables: ["Table Infections", "Student Infections"],
    yVariable: "Frequency",
    component: HistogramPlot,
    notes: {
      "Table Infections": "Adapt to Table Infection Status, each table is numbered on the x-axis",
      "Student Infections": "Adapt to Student Infection Status, each student is numbered on the x-axis"
    }
  },
  pie: {
    label: 'Pie Plot',
    component: PiePlot,
    // No variables or allowedMatrix needed; PiePlot handles its own variable selection
  },
  // Add more plot types here as needed
};

const playerNames = [
  "Red Fox", "Blue Whale", "Green Turtle", "Purple Butterfly", "Orange Tiger", "Yellow Lion", "Pink Dolphin", "Brown Bear", "Black Panther", "White Eagle", "Gray Wolf", "Golden Eagle"
];

const PlotComponent = ({ plotLabel, theme, data, logAction }) => {
  const [plotType, setPlotType] = useState('line');
  const [xVar, setXVar] = useState("");
  const [yVar, setYVar] = useState("");
  const [personFilter, setPersonFilter] = useState(playerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));

  // Get config for current plot type
  const config = plotConfigs[plotType];
  const allowedMatrix = config.allowedMatrix;
  const variables = config.variables;
  const PlotRenderer = config.component;

  // Filter/transform data for the selected X/Y variables and person filter
  // (This is a placeholder; actual data transformation logic may be needed)
  const filteredData = data; // TODO: implement filtering based on xVar, yVar, personFilter

  return (
    <div style={{ flex: 1, background: 'var(--cream-panel)', border: '2px solid var(--divider-green-light)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--text-dark)' }}>{plotLabel}</h3>
        <select
          value={plotType}
          onChange={e => {
            setPlotType(e.target.value);
            setXVar("");
            setYVar("");
            if (logAction) logAction(`${plotLabel} type changed to: ${e.target.value}`);
          }}
          style={{ padding: '0.5rem', fontSize: '1rem', background: 'var(--offwhite-bg)', color: 'var(--text-dark)', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
        >
          {Object.entries(plotConfigs).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, background: 'var(--offwhite-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)', fontSize: '1.2rem' }}>
        {xVar && yVar ? (
          <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>{yVar} vs. {xVar}</div>
        ) : (
          <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>Select X and Y variables</div>
        )}
        <div style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>
          {xVar ? `X: ${xVar}` : 'X: —'}
          {" | "}
          {yVar ? `Y: ${yVar}` : 'Y: —'}
        </div>
        <div style={{ marginTop: '1rem', color: '#aaa', fontSize: '1rem' }}>
          (No data to display)
        </div>
      </div>
      {/* Render the actual plot FIRST */}
      <div style={{
        marginBottom: '1.2rem',
        flex: 1,
        minHeight: 320,
        maxHeight: 420,
        height: 380,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {plotType === 'pie' ? (
          <PiePlot theme={theme} logAction={logAction} />
        ) : (
          <PlotRenderer data={filteredData} theme={theme} />
        )}
      </div>
      {/* Controls BELOW the plot */}
      {plotType === 'pie' ? (
        <div style={{ marginTop: 0, background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)', width: '100%', maxWidth: 480, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Variables:</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {["Table Infections", "Student Infections"].map(v => (
              <label key={v} style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                <input
                  type="radio"
                  name={`pie-var-${plotLabel}`}
                  checked={xVar === v}
                  onChange={() => {
                    setXVar(v);
                    if (logAction) logAction(`${plotLabel} variable set to: ${v}`);
                  }}
                  style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
                />
                {v}
              </label>
            ))}
          </div>
        </div>
      ) : plotType === 'histogram' ? (
        <div style={{ marginTop: 0, background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)', width: '100%', maxWidth: 480, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>X Variables:</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {variables.map(x => (
              <label key={x} style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                <input
                  type="radio"
                  name={`histogram-xvar-${plotLabel}`}
                  checked={xVar === x}
                  onChange={() => {
                    setXVar(x);
                    if (logAction) logAction(`${plotLabel} X variable set to: ${x}`);
                  }}
                  style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
                />
                {x}
              </label>
            ))}
          </div>
        </div>
      ) : allowedMatrix && (
        <div style={{ marginTop: 0, background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)', width: '100%', maxWidth: 480, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            {/* X Variables */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>X Variables:</div>
              {variables.map(x => {
                const xEnabled = yVar ? allowedMatrix[x][yVar] : Object.values(allowedMatrix[x]).some(v => v);
                return (
                  <label key={x} style={{ display: 'block', color: xEnabled ? 'var(--text-dark)' : '#bbb', marginBottom: '0.3rem' }}>
                    <input
                      type="checkbox"
                      checked={xVar === x}
                      disabled={!xEnabled}
                      onChange={() => {
                        if (xVar === x) {
                          setXVar("");
                          if (logAction) logAction(`${plotLabel} X variable deselected: ${x}`);
                        } else {
                          setXVar(x);
                          if (logAction) logAction(`${plotLabel} X variable set to: ${x}`);
                          if (yVar && !allowedMatrix[x][yVar]) setYVar("");
                        }
                      }}
                      style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
                    />
                    {x}
                  </label>
                );
              })}
            </div>
            {/* Y Variables */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Y Variables:</div>
              {variables.map(y => {
                const yEnabled = xVar ? (xVar !== y && allowedMatrix[xVar][y]) : Object.keys(allowedMatrix).some(x => allowedMatrix[x][y]);
                return (
                  <label key={y} style={{ display: 'block', color: yEnabled ? 'var(--text-dark)' : '#bbb', marginBottom: '0.3rem' }}>
                    <input
                      type="checkbox"
                      checked={yVar === y}
                      disabled={!yEnabled}
                      onChange={() => {
                        if (yVar === y) {
                          setYVar("");
                          if (logAction) logAction(`${plotLabel} Y variable deselected: ${y}`);
                        } else {
                          setYVar(y);
                          if (logAction) logAction(`${plotLabel} Y variable set to: ${y}`);
                          if (xVar && !allowedMatrix[xVar][y]) setXVar("");
                        }
                      }}
                      style={{ accentColor: 'var(--accent-green)', marginRight: '0.5rem' }}
                    />
                    {y}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Person Filter for both plot types (can be made conditional per plot type if needed) */}
      {plotType !== 'pie' && (
        <div style={{ marginTop: '1.2rem', background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)', width: '100%', maxWidth: 480, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Person Filter:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
            {playerNames.map(name => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={personFilter[name]}
                  onChange={() => {
                    setPersonFilter(prev => ({ ...prev, [name]: !prev[name] }));
                    if (logAction) logAction(`${plotLabel} person filter toggled: ${name} ${!personFilter[name] ? 'selected' : 'deselected'}`);
                  }}
                  style={{ accentColor: 'var(--accent-green)' }}
                />
                {name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotComponent; 