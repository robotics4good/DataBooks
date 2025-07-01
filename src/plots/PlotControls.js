// PlotControls.js - Component for plot control UI
import React from 'react';
import styles from './PlotComponent.module.css';
import { playerNames } from './plotConfigs';
import { isYAllowed, isXAllowed } from './plotUtils';

const PlotControls = ({
  plotType,
  variables,
  xVars,
  yVars,
  personFilter,
  allowedMatrix,
  plotLabel,
  onPlotTypeChange,
  onXVariableToggle,
  onYVariableToggle,
  onHistogramXVariableToggle,
  onPieVariableSelect,
  onPersonFilterToggle,
}) => {
  return (
    <div className={styles.controlsContainer}>
      <div className={styles.optionsArea}>
        {/* Plot type selector */}
        <div className={styles.plotTypeSelector}>
          <select
            value={plotType}
            onChange={(e) => onPlotTypeChange(e.target.value)}
            className={styles.plotTypeSelect}
          >
            <option value="line">Line Plot</option>
            <option value="scatter">Scatter Plot</option>
            <option value="bar">Bar Plot</option>
            <option value="histogram">Histogram Plot</option>
            <option value="pie">Pie Plot</option>
          </select>
        </div>

        {/* Variable options (X/Y) */}
        {plotType !== 'pie' && plotType !== 'histogram' && (
          <>
            <div className={styles.variableOptionsLabel}>Variable Options:</div>
            <div className={styles.variableOptionsContainer}>
              <div className={styles.variableColumn}>
                <div className={styles.variableColumnLabel}>X:</div>
                {variables && variables.map(v => (
                  <label 
                    key={v} 
                    className={`${styles.variableLabel} ${yVars.length > 0 && !isXAllowed(allowedMatrix, yVars[0], v) ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={xVars.includes(v)}
                      disabled={yVars.length > 0 && !isXAllowed(allowedMatrix, yVars[0], v)}
                      onChange={() => onXVariableToggle(v)}
                      className={styles.variableCheckbox}
                    />
                    {v}
                  </label>
                ))}
              </div>
              <div className={styles.variableColumn}>
                <div className={styles.variableColumnLabel}>Y:</div>
                {variables && variables.map(v => (
                  <label 
                    key={v} 
                    className={`${styles.variableLabel} ${xVars.length > 0 && !isYAllowed(allowedMatrix, xVars[0], v) ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={yVars.includes(v)}
                      disabled={xVars.length > 0 && !isYAllowed(allowedMatrix, xVars[0], v)}
                      onChange={() => onYVariableToggle(v)}
                      className={styles.variableCheckbox}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Histogram special case */}
        {plotType === 'histogram' && (
          <>
            <div className={styles.variableOptionsLabel}>Variable Options:</div>
            <div className={styles.variableOptionsContainer}>
              {variables.map(v => (
                <label 
                  key={v} 
                  className={`${styles.variableLabel} ${yVars.length > 0 && !isXAllowed(allowedMatrix, yVars[0], v) ? styles.disabled : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={xVars.includes(v)}
                    disabled={yVars.length > 0 && !isXAllowed(allowedMatrix, yVars[0], v)}
                    onChange={() => onHistogramXVariableToggle(v)}
                    className={styles.variableCheckbox}
                  />
                  {v}
                </label>
              ))}
            </div>
            <div className={styles.histogramYLabel}>Y: Frequency</div>
          </>
        )}

        {/* Pie special case */}
        {plotType === 'pie' && (
          <>
            <div className={styles.variableOptionsLabel}>Variable Options:</div>
            <div className={styles.variableOptionsContainer}>
              {['Table Infections', 'Student Infections'].map(v => (
                <label key={v} className={styles.variableLabel}>
                  <input
                    type="radio"
                    name={`pie-var-${plotLabel}`}
                    checked={xVars.includes(v)}
                    onChange={() => onPieVariableSelect(v)}
                    className={styles.variableRadio}
                  />
                  {v}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Device filter (always at the bottom of options) */}
        <div className={styles.deviceFilterContainer}>
          <div className={styles.deviceFilterLabel}>Device Filter:</div>
          <div className={styles.deviceFilterOptions}>
            {playerNames.map(name => (
              <label key={name} className={styles.deviceFilterOption}>
                <input
                  type="checkbox"
                  checked={personFilter[name]}
                  onChange={() => onPersonFilterToggle(name)}
                  className={styles.deviceFilterCheckbox}
                />
                {name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotControls; 