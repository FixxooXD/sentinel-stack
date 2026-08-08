import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardOverview from "./pages/DashboardOverview";
import TargetInsights from "./pages/TargetInsights";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/targets/:targetId" element={<TargetInsights />} />
      </Routes>
    </Router>
  );
}

export default App;
