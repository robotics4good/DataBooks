// plotConfigs.js - Configuration data for different plot types
import LinePlot from './LinePlot';
import ScatterPlot from './ScatterPlot';
import BarPlot from './BarPlot';
import HistogramPlot from './HistogramPlot';
import PiePlot from './PiePlot';

// Player names constant
export const playerNames = [
  "Red Fox", "Blue Whale", "Green Turtle", "Purple Butterfly", "Orange Tiger", "Yellow Lion", 
  "Pink Dolphin", "Brown Bear", "Black Panther", "White Eagle", "Gray Wolf", "Golden Eagle"
];

// Modular config for each plot type
export const plotConfigs = {
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