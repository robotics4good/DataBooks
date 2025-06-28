import React, { useState } from 'react';
import LinePlot from './LinePlot';
import ScatterPlot from './ScatterPlot';

const allowedMatrix = {
  "Time":              { "Time": false, "Tasks Completed": true,  "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
  "Tasks Completed":   { "Time": true,  "Tasks Completed": false, "Meetings Held": true,  "Table Infections": true,  "Student Infections": true },
  "Meetings Held":     { "Time": true,  "Tasks Completed": true,  "Meetings Held": false, "Table Infections": false, "Student Infections": false },
  "Table Infections":  { "Time": false, "Tasks Completed": false, "Meetings Held": false, "Table Infections": false, "Student Infections": false },
  "Student Infections":{ "Time": false, "Tasks Completed": false, "Meetings Held": false, "Table Infections": false, "Student Infections": false },
};

const linePlotVars = ["Time", "Tasks Completed", "Meetings Held", "Table Infections", "Student Infections"];
const playerNames = [
  "Red Fox", "Blue Whale", "Green Turtle", "Purple Butterfly", "Orange Tiger", "Yellow Lion", "Pink Dolphin", "Brown Bear", "Black Panther", "White Eagle", "Gray Wolf", "Golden Eagle"
];
const plotTypes = [
  { value: 'line', label: 'Line Plot' },
  { value: 'scatter', label: 'Scatter Plot' },
  // Add more plot types as needed
];

const UnifiedPlot = ({ plotLabel, theme, data, logAction }) => {
  const [plotType, setPlotType] = useState('line');
  const [xVar, setXVar] = useState("");
  const [yVar, setYVar] = useState("");
  const [personFilter, setPersonFilter] = useState(playerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));

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
          {plotTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, background: 'var(--offwhite-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)', fontSize: '1.2rem' }}>
        {plotType === 'line' || plotType === 'scatter' ? (
          <>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              {xVar && yVar ? `${yVar} vs. ${xVar}` : 'Select X and Y variables'}
            </div>
            <div style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>
              {xVar ? `X: ${xVar}` : 'X: —'}
              {" | "}
              {yVar ? `Y: ${yVar}` : 'Y: —'}
            </div>
            <div style={{ marginTop: '1rem', color: '#aaa', fontSize: '1rem' }}>
              (No data to display)
            </div>
          </>
        ) : (
          <>{plotType.charAt(0).toUpperCase() + plotType.slice(1)} Plot</>
        )}
      </div>
      {/* X/Y variable checkboxes below plot */}
      {(plotType === 'line' || plotType === 'scatter') && (
        <div style={{ marginTop: '1.5rem', background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)' }}>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            {/* X Variables */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>X Variables:</div>
              {linePlotVars.map(x => {
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
              {linePlotVars.map(y => {
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
      {/* Person Filter for both plot types */}
      {(plotType === 'line' || plotType === 'scatter') && (
        <div style={{ marginTop: '1.5rem', background: 'var(--cream-panel)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--divider-green-light)' }}>
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
      {/* Render the actual plot (placeholder: only passes data, theme) */}
      <div style={{ marginTop: '2rem', flex: 1, minHeight: 300 }}>
        {plotType === 'line' && <LinePlot data={filteredData} theme={theme} />}
        {plotType === 'scatter' && <ScatterPlot data={filteredData} theme={theme} />}
      </div>
    </div>
  );
};

export default UnifiedPlot; 