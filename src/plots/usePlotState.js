// usePlotState.js - Custom hook for managing plot component state
import { useState, useEffect } from 'react';
import { playerNames, plotConfigs } from './plotConfigs';
import { initializeVariableFilters, initializePersonFilter } from './plotUtils';

/**
 * Custom hook for managing plot component state
 * @param {string} plotLabel - Label for the plot (for logging)
 * @param {Function} logAction - Logging function
 * @returns {Object} - Plot state and state management functions
 */
export function usePlotState(plotLabel, logAction) {
  // Core plot state
  const [plotType, setPlotType] = useState('line');
  const [xVars, setXVars] = useState([]);
  const [yVars, setYVars] = useState([]);
  
  // Filter states
  const [personFilter, setPersonFilter] = useState(initializePersonFilter(playerNames));
  const [xVarFilter, setXVarFilter] = useState({});
  const [yVarFilter, setYVarFilter] = useState({});

  // Get config for current plot type
  const config = plotConfigs[plotType];
  const allowedMatrix = config.allowedMatrix;
  const variables = config.variables;
  const PlotRenderer = config.component;

  // Initialize filters when variables change
  useEffect(() => {
    if (variables) {
      setXVarFilter(initializeVariableFilters(variables));
      setYVarFilter(initializeVariableFilters(variables));
    }
  }, [variables]);

  // Plot type change handler
  const handlePlotTypeChange = (newPlotType) => {
    setPlotType(newPlotType);
    setXVars([]);
    setYVars([]);
    if (logAction) {
      logAction(`${plotLabel} type changed to: ${newPlotType}`);
    }
  };

  // X variable toggle handler
  const handleXVariableToggle = (variable) => {
    const isSelected = xVars.includes(variable);
    const newXVars = isSelected 
      ? xVars.filter(x => x !== variable) 
      : [...xVars, variable];
    
    setXVars(newXVars);
    if (logAction) {
      logAction(`${plotLabel} x variable toggled: ${variable}`);
    }
  };

  // Y variable toggle handler
  const handleYVariableToggle = (variable) => {
    const isSelected = yVars.includes(variable);
    const newYVars = isSelected 
      ? yVars.filter(y => y !== variable) 
      : [...yVars, variable];
    
    setYVars(newYVars);
    if (logAction) {
      logAction(`${plotLabel} y variable toggled: ${variable}`);
    }
  };

  // Histogram X variable toggle handler
  const handleHistogramXVariableToggle = (variable) => {
    const isSelected = xVars.includes(variable);
    const newXVars = isSelected 
      ? xVars.filter(x => x !== variable) 
      : [...xVars, variable];
    
    setXVars(newXVars);
    if (logAction) {
      logAction(`${plotLabel} histogram x variable toggled: ${variable}`);
    }
  };

  // Pie variable selection handler
  const handlePieVariableSelect = (variable) => {
    setXVars([variable]); // Pie plots only allow one variable
    if (logAction) {
      logAction(`${plotLabel} variable set to: ${variable}`);
    }
  };

  // Person filter toggle handler
  const handlePersonFilterToggle = (name) => {
    const newValue = !personFilter[name];
    setPersonFilter(prev => ({ ...prev, [name]: newValue }));
    if (logAction) {
      logAction(`${plotLabel} person filter toggled: ${name} ${newValue ? 'selected' : 'deselected'}`);
    }
  };

  return {
    // State
    plotType,
    xVars,
    yVars,
    personFilter,
    xVarFilter,
    yVarFilter,
    
    // Config
    config,
    allowedMatrix,
    variables,
    PlotRenderer,
    
    // Handlers
    handlePlotTypeChange,
    handleXVariableToggle,
    handleYVariableToggle,
    handleHistogramXVariableToggle,
    handlePieVariableSelect,
    handlePersonFilterToggle,
  };
} 