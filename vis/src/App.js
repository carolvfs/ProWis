import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'

import './App.css'

import { BrowserRouter } from 'react-router-dom'
import Routes from './routes/Routes'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes/>
      </div> 
    </BrowserRouter>
  )
}

export default App;
