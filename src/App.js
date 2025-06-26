import React, { useState } from "react";
import SingleScreenLayout from "./SingleScreenLayout";
import { UserLogProvider } from "./UserLog";
import "./App.css";

const App = () => (
  <UserLogProvider>
    <div className="App">
      <div className="size-unsupported-message">
        Please make your browser window larger to use the application.
      </div>
      <div className="main-content">
        <SingleScreenLayout />
      </div>
    </div>
  </UserLogProvider>
);

export default App;
