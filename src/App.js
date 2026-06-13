import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Ban,
  CarFront,
  Check,
  Clock3,
  History,
  Loader2,
  LogOut,
  MapPin,
  Radio,
  RefreshCw,
  Route,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { fetchRideHistory, historyMode, persistRideHistory } from './services/historyApi';
import { publishTrip, realtimeMode, subscribeTrip } from './services/realtime';

const credentials = {
  username: 'intern@namlotech.com',
  password: 'namlo2026',
};

const kathmandu = [27.7172, 85.324];
const pickup = [27.7156, 85.3124];
const destination = [27.7055, 85.3451];
const initialDriver = [27.7296, 85.3346];

const routePoints = [
  initialDriver,
  [27.7254, 85.331],
  [27.7217, 85.3268],
  [27.7186, 85.3203],
  pickup,
  [27.7136, 85.3225],
  [27.7104, 85.3308],
  [27.7078, 85.3389],
  destination,
];

const statusLabels = {
  idle: 'Idle',
  requesting: 'Requesting',
  accepted: 'Driver assigned',
  active: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

function createMarkerIcon(kind) {
  return L.divIcon({
    className: `map-marker map-marker--${kind}`,
    html: `<span></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const riderIcon = createMarkerIcon('rider');
const driverIcon = createMarkerIcon('driver');
const destinationIcon = createMarkerIcon('destination');

function createTrip() {
  return {
    id: `ride-${Date.now()}`,
    rider: 'Demo Rider',
    driver: null,
    status: 'requesting',
    pickup,
    destination,
    driverPosition: initialDriver,
    routeIndex: 0,
    fare: 420,
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    note: 'Thamel to Boudha',
  };
}

function FitMap({ trip }) {
  const map = useMap();

  useEffect(() => {
    if (!trip) {
      map.setView(kathmandu, 13);
      return;
    }

    const points = [trip.pickup, trip.destination, trip.driverPosition].filter(Boolean);
    map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
  }, [map, trip]);

  return null;
}

function Login({ onLogin }) {
  const [form, setForm] = useState(credentials);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (form.username === credentials.username && form.password === credentials.password) {
      setError('');
      onLogin();
      return;
    }

    setError('Invalid testing credentials.');
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Namlo Technologies</p>
          <h1 id="login-title">Namlo Rides Simulator</h1>
          <p className="login-copy">
            A web-only ride-sharing control room for evaluating rider requests, driver actions,
            realtime telemetry, and terminal ride history.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button--primary" type="submit">
            <Check size={18} />
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function RideMap({ trip }) {
  const path = useMemo(() => {
    if (!trip) {
      return [];
    }

    return [trip.pickup, trip.destination];
  }, [trip]);

  return (
    <section className="map-shell" aria-label="Kathmandu ride map">
      <MapContainer center={kathmandu} zoom={13} scrollWheelZoom className="ride-map">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMap trip={trip} />
        {trip ? (
          <>
            <Marker position={trip.pickup} icon={riderIcon}>
              <Tooltip permanent direction="top">
                Pickup
              </Tooltip>
            </Marker>
            <Marker position={trip.destination} icon={destinationIcon}>
              <Tooltip permanent direction="top">
                Destination
              </Tooltip>
            </Marker>
            <Marker position={trip.driverPosition} icon={driverIcon}>
              <Tooltip permanent direction="top">
                Driver
              </Tooltip>
            </Marker>
            <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 4, dashArray: '8 8' }} />
            <Polyline
              positions={routePoints.slice(0, trip.routeIndex + 1)}
              pathOptions={{ color: '#0f766e', weight: 5 }}
            />
          </>
        ) : (
          <Marker position={kathmandu} icon={destinationIcon}>
            <Tooltip permanent direction="top">
              Kathmandu
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiderPanel({ trip, onRequest, onCancel }) {
  const canRequest = !trip || ['completed', 'cancelled', 'rejected'].includes(trip.status);
  const canCancel = trip && ['requesting', 'accepted', 'active'].includes(trip.status);

  return (
    <section className="workspace-panel rider-panel" aria-labelledby="rider-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Rider interface</p>
          <h2 id="rider-title">Request a ride</h2>
        </div>
        <UserRound size={24} />
      </div>

      <div className="route-card">
        <div>
          <MapPin size={18} />
          <span>Pickup</span>
          <strong>Thamel, Kathmandu</strong>
        </div>
        <div>
          <Route size={18} />
          <span>Destination</span>
          <strong>Boudha Stupa</strong>
        </div>
      </div>

      <div className="action-row">
        <button className="button button--primary" disabled={!canRequest} onClick={onRequest}>
          <Send size={18} />
          Request ride
        </button>
        <button className="button button--danger" disabled={!canCancel} onClick={() => onCancel('cancelled')}>
          <X size={18} />
          Cancel
        </button>
      </div>

      <div className="status-strip">
        <Clock3 size={18} />
        <span>Rider state</span>
        <strong>{trip ? statusLabels[trip.status] : 'Ready'}</strong>
      </div>
    </section>
  );
}

function DriverPanel({ trip, onAccept, onReject, onComplete }) {
  const canAccept = trip?.status === 'requesting';
  const canReject = trip?.status === 'requesting';
  const canComplete = trip?.status === 'active';

  return (
    <section className="workspace-panel driver-panel" aria-labelledby="driver-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Driver interface</p>
          <h2 id="driver-title">Driver console</h2>
        </div>
        <CarFront size={26} />
      </div>

      <div className="driver-job">
        {trip && ['requesting', 'accepted', 'active'].includes(trip.status) ? (
          <>
            <div>
              <span>Incoming ride</span>
              <strong>{trip.note}</strong>
            </div>
            <div>
              <span>Estimated fare</span>
              <strong>NPR {trip.fare}</strong>
            </div>
          </>
        ) : (
          <p>No active ride request.</p>
        )}
      </div>

      <div className="action-row">
        <button className="button button--primary" disabled={!canAccept} onClick={onAccept}>
          <Check size={18} />
          Accept
        </button>
        <button className="button button--danger" disabled={!canReject} onClick={() => onReject('rejected')}>
          <Ban size={18} />
          Reject
        </button>
        <button className="button button--success" disabled={!canComplete} onClick={() => onComplete('completed')}>
          <Check size={18} />
          Complete
        </button>
      </div>
    </section>
  );
}

function HistoryPanel({ history, loading, error, onRefresh }) {
  return (
    <section className="history-panel" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">REST history</p>
          <h2 id="history-title">Resolved trips</h2>
        </div>
        <button className="icon-button" onClick={onRefresh} aria-label="Refresh history">
          {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </div>

      {error && <p className="inline-error">{error}</p>}
      <div className="history-list">
        {history.length === 0 && !loading ? (
          <p className="empty-state">No completed, cancelled, or rejected trips yet.</p>
        ) : (
          history.map((ride) => (
            <article className="history-item" key={`${ride.id}-${ride.savedAt || ride.updatedAt}`}>
              <span className={`status-pill status-pill--${ride.status}`}>{statusLabels[ride.status]}</span>
              <strong>{ride.note || 'Kathmandu ride'}</strong>
              <span>
                {ride.driver || 'No driver'} · NPR {ride.fare || 0}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Dashboard({ onLogout }) {
  const [trip, setTrip] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const terminalPersisted = useRef(new Set());

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const records = await fetchRideHistory();
      setHistory(Array.isArray(records) ? records.slice().reverse() : []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const updateTrip = useCallback((updater) => {
    setTrip((currentTrip) => {
      const nextTrip = typeof updater === 'function' ? updater(currentTrip) : updater;
      if (nextTrip) {
        publishTrip({ ...nextTrip, updatedAt: new Date().toISOString() });
      }
      return nextTrip;
    });
  }, []);

  const resolveTrip = useCallback(
    (status) => {
      updateTrip((currentTrip) => {
        if (!currentTrip) {
          return currentTrip;
        }

        return {
          ...currentTrip,
          status,
          resolvedAt: new Date().toISOString(),
        };
      });
    },
    [updateTrip]
  );

  useEffect(() => subscribeTrip((nextTrip) => setTrip(nextTrip)), []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!trip || !['completed', 'cancelled', 'rejected'].includes(trip.status)) {
      return;
    }

    if (terminalPersisted.current.has(trip.id)) {
      return;
    }

    terminalPersisted.current.add(trip.id);
    persistRideHistory(trip)
      .then((record) => setHistory((currentHistory) => [record, ...currentHistory]))
      .catch((error) => setHistoryError(error.message));
  }, [trip]);

  useEffect(() => {
    if (!trip || trip.status !== 'active') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      updateTrip((currentTrip) => {
        if (!currentTrip || currentTrip.status !== 'active') {
          return currentTrip;
        }

        const nextIndex = Math.min(currentTrip.routeIndex + 1, routePoints.length - 1);
        return {
          ...currentTrip,
          driverPosition: routePoints[nextIndex],
          routeIndex: nextIndex,
          status: nextIndex === routePoints.length - 1 ? 'completed' : 'active',
        };
      });
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [trip, updateTrip]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Real-time ride sharing simulator</p>
          <h1>Namlo Rides</h1>
        </div>
        <div className="topbar-actions">
          <span className="mode-chip">
            <Radio size={16} />
            Realtime: {realtimeMode}
          </span>
          <span className="mode-chip">
            <History size={16} />
            History: {historyMode}
          </span>
          <button className="icon-button" onClick={onLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Ride metrics">
        <Metric icon={Clock3} label="Lifecycle" value={trip ? statusLabels[trip.status] : 'Ready'} />
        <Metric icon={CarFront} label="Driver" value={trip?.driver || 'Unassigned'} />
        <Metric icon={Route} label="Route" value="Thamel to Boudha" />
      </section>

      <RideMap trip={trip} />

      <section className="workspace-grid">
        <RiderPanel
          trip={trip}
          onRequest={() => updateTrip(createTrip())}
          onCancel={resolveTrip}
        />
        <DriverPanel
          trip={trip}
          onAccept={() =>
            updateTrip((currentTrip) => ({
              ...currentTrip,
              status: 'active',
              driver: 'Namlo Driver A',
              acceptedAt: new Date().toISOString(),
              routeIndex: 0,
            }))
          }
          onReject={resolveTrip}
          onComplete={resolveTrip}
        />
        <HistoryPanel
          history={history}
          loading={historyLoading}
          error={historyError}
          onRefresh={loadHistory}
        />
      </section>
    </main>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('namlo-rides-authenticated') === 'true'
  );

  function handleLogin() {
    localStorage.setItem('namlo-rides-authenticated', 'true');
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem('namlo-rides-authenticated');
    setIsAuthenticated(false);
  }

  return isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Login onLogin={handleLogin} />;
}

export default App;
