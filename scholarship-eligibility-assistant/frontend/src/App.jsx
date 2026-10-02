import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Results from './pages/Results';
import SchemeDetails from './pages/SchemeDetails';
import Schemes from './pages/Schemes';
import Shortlist from './pages/Shortlist';
import Simulator from './pages/Simulator';
import Wallet from './pages/Wallet';
import { EmptyState } from './components/Feedback';
import { Link } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/results" element={<Results />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/scheme/:id" element={<SchemeDetails />} />
        <Route path="/shortlist" element={<Shortlist />} />
        <Route
          path="*"
          element={
            <EmptyState title="Page not found" message="The page you are looking for does not exist.">
              <Link to="/" className="btn-primary">Go home</Link>
            </EmptyState>
          }
        />
      </Route>
    </Routes>
  );
}
