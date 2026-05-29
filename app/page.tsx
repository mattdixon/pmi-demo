import Dashboard from "./Dashboard";

// Server-rendered shell; the live data is polled client-side every 2s.
export default function Home() {
  return (
    <main className="page">
      <div className="header">
        <h1>PMI Aspire — AI Receptionist</h1>
        <div className="sub">
          Proof of concept · after-hours call loop · mocked AppFolio data · live
        </div>
      </div>
      <Dashboard />
    </main>
  );
}
