import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import necessary components from react-router-dom
import './App.css';
import Camera from './camera/Camera';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Camera />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
