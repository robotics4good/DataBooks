// usePlotState.js - Custom hook for managing plot component state
import { useState, useEffect } from 'react';
import { playerNames, plotConfigs } from './plotConfigs';
import { initializeVariableFilters, initializeCadetFilter } from './plotUtils';

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
  const [cadetFilter, setCadetFilter] = useState(initializeCadetFilter(playerNames));
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
      logAction('plot_interaction', { action: 'type_changed', plotLabel, newPlotType });
    }
  };

  // X variable toggle handler (single-select)
  const handleXVariableToggle = (variable) => {
    const isSelected = xVars.includes(variable);
    const newXVars = isSelected ? [] : [variable];
    setXVars(newXVars);
    if (logAction) {
      logAction('plot_interaction', { action: 'x_variable_toggled', plotLabel, variable, selected: !isSelected });
    }
  };

  // Y variable toggle handler (single-select)
  const handleYVariableToggle = (variable) => {
    const isSelected = yVars.includes(variable);
    const newYVars = isSelected ? [] : [variable];
    setYVars(newYVars);
    if (logAction) {
      logAction('plot_interaction', { action: 'y_variable_toggled', plotLabel, variable, selected: !isSelected });
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
      logAction('plot_interaction', { action: 'histogram_x_variable_toggled', plotLabel, variable, selected: !isSelected });
    }
  };

  // Pie variable selection handler
  const handlePieVariableSelect = (variable) => {
    setXVars([variable]); // Pie plots only allow one variable
    if (logAction) {
      logAction('plot_interaction', { action: 'pie_variable_selected', plotLabel, variable });
    }
  };

  // Cadet filter toggle handler
  const handleCadetFilterToggle = (name) => {
    const newValue = !cadetFilter[name];
    setCadetFilter(prev => ({ ...prev, [name]: newValue }));
    if (logAction) {
      logAction('plot_interaction', { action: 'cadet_filter_toggled', plotLabel, cadet: name, selected: newValue });
    }
  };

  // Cadet filter select all/deselect all handlers
  const onSelectAllCadets = () => {
    setCadetFilter(playerNames.reduce((acc, name) => ({ ...acc, [name]: true }), {}));
    if (logAction) {
      logAction('plot_interaction', { action: 'cadet_filter_select_all', plotLabel });
    }
  };
  const onDeselectAllCadets = () => {
    setCadetFilter(playerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));
    if (logAction) {
      logAction('plot_interaction', { action: 'cadet_filter_deselect_all', plotLabel });
    }
  };

  return {
    // State
    plotType,
    xVars,
    yVars,
    cadetFilter,
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
    handleCadetFilterToggle,
    onSelectAllCadets,
    onDeselectAllCadets,
  };
} 