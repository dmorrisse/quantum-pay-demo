import React, { useState, useEffect } from 'react';

/**
 * Main application component.  This component orchestrates the four screen
 * flow:
 * 0. Pay Bill
 * 1. Mastercard Data Connect introduction
 * 2. Find your bank
 * 3. Share data / connect
 */
function App() {
  const [step, setStep] = useState(0);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [events, setEvents] = useState([]);

  // Fetch the list of banks when the user navigates to the find bank screen.
  useEffect(() => {
    if (step === 2 && banks.length === 0) {
      fetch('/api/banks')
        .then(res => res.json())
        .then(data => setBanks(data.banks || []))
        .catch(() => setBanks([]));
    }
  }, [step, banks.length]);

  // Poll recent events when on the share data screen.  This allows the
  // user to see error events in real time when demonstrating a failure.
  useEffect(() => {
    let timer;
    function loadEvents() {
      fetch('/api/events/recent')
        .then(res => res.json())
        .then(data => setEvents(data.events || []))
        .catch(() => setEvents([]));
    }
    if (step === 3) {
      loadEvents();
      timer = setInterval(loadEvents, 5000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Handle the click on "Pay by bank" on the first screen
  const handlePayByBank = () => {
    setStep(1);
  };

  // Advance from the introduction screen to the find bank screen
  const handleNextIntro = () => {
    setStep(2);
  };

  // When the user selects a bank, store it and advance to the share data screen
  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setStep(3);
  };

  // Call the backend to simulate connecting to the selected bank.  This
  // function sets a loading state and displays a success or error message
  // once the API call completes.
  const handleConnect = async () => {
    if (!selectedBank) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId: selectedBank.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Connection failed' });
      } else {
        setMessage({ type: 'success', text: `Connected: ${data.account.institution} ${data.account.mask}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 p-4">
      {step === 0 && <PayBillScreen onPayByBank={handlePayByBank} />}
      {step === 1 && <IntroScreen onNext={handleNextIntro} />}
      {step === 2 && <FindBankScreen banks={banks} onSelectBank={handleSelectBank} />}
      {step === 3 && <ShareDataScreen bank={selectedBank} onConnect={handleConnect} loading={loading} message={message} events={events} />}
    </div>
  );
}

/**
 * Screen 0: Displays the bill amount and lets the user select a payment method.
 */
function PayBillScreen({ onPayByBank }) {
  return (
    <div className="max-w-sm w-full mt-16">
      <h1 className="text-2xl font-semibold mb-4 text-center">Pay Bill</h1>
      <div className="text-center mb-6">
        <div className="text-4xl font-bold">$69.45</div>
        <div className="text-sm text-gray-500">Balance due February 8</div>
      </div>
      <p className="text-sm text-gray-700 mb-4">First, select a payment type:</p>
      <div className="space-y-4">
        <button onClick={onPayByBank} className="w-full border rounded-lg p-4 text-left hover:bg-gray-100 focus:outline-none">
          <div className="font-medium">Pay by bank</div>
          <div className="text-sm text-gray-500">Make streamlined and secure payments, direct from your bank account, with lower fees.</div>
        </button>
        <div className="w-full border rounded-lg p-4 text-left opacity-60 cursor-not-allowed">
          <div className="font-medium">Debit/credit card</div>
          <div className="text-sm text-gray-500">Convenient and versatile payment option, fast and simple.</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Screen 1: Introduces Mastercard Data Connect and explains how data is used.
 */
function IntroScreen({ onNext }) {
  return (
    <div className="max-w-md w-full mt-12 p-6 bg-white rounded-xl shadow">
      <div className="flex justify-around mb-6">
        <span className="text-4xl">📱</span>
        <span className="text-4xl">💳</span>
        <span className="text-4xl">🏦</span>
      </div>
      <p className="mb-4 text-center text-lg">
        <span className="font-semibold">Quantum Pay</span> uses <span className="font-semibold">Mastercard Data Connect</span> to link your accounts
      </p>
      <div className="space-y-3 mb-6">
        <div className="border rounded-lg p-3 flex items-start space-x-3">
          <span>🔒</span>
          <p className="text-sm">Your data will be securely accessed, processed and shared</p>
        </div>
        <div className="border rounded-lg p-3 flex items-start space-x-3">
          <span>✅</span>
          <p className="text-sm">Your data will only be saved and used with your permission</p>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 mb-4">
        By pressing Next, you agree to the Mastercard Data Connect Terms of Use and acknowledge the Privacy Notice
      </p>
      <button onClick={onNext} className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 focus:outline-none">
        Next
      </button>
      <div className="mt-4 flex justify-center items-center space-x-1 text-xs text-gray-500">
        <span>secured by</span>
        <div className="flex items-center space-x-0.5">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400 -ml-1"></div>
        </div>
        <span className="font-medium">Mastercard</span>
      </div>
    </div>
  );
}

/**
 * Screen 2: Displays a search box (disabled) and a grid of banks for the user
 * to select from.  Each bank comes from the API.
 */
function FindBankScreen({ banks, onSelectBank }) {
  return (
    <div className="max-w-md w-full mt-8">
      <h2 className="text-xl font-semibold mb-4">Find your bank</h2>
      <input
        type="text"
        placeholder="Search for your bank"
        className="w-full p-2 border rounded-lg mb-4"
        disabled
      />
      <div className="grid grid-cols-2 gap-4">
        {banks.map(bank => (
          <button
            key={bank.id}
            onClick={() => onSelectBank(bank)}
            className="border rounded-lg p-4 flex items-center justify-center hover:bg-gray-100 focus:outline-none"
          >
            <span className="font-medium text-center">{bank.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center items-center space-x-1 text-xs text-gray-500">
        <span>secured by</span>
        <div className="flex items-center space-x-0.5">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400 -ml-1"></div>
        </div>
        <span className="font-medium">Mastercard</span>
      </div>
    </div>
  );
}

/**
 * Screen 3: Shows the selected bank and allows the user to click "Next" to
 * attempt the connection.  Recent events are displayed below for demo
 * purposes.  If the backend returns an error, an error banner is shown.
 */
function ShareDataScreen({ bank, onConnect, loading, message, events }) {
  return (
    <div className="max-w-md w-full mt-12">
      <div className="flex justify-center mb-6">
        {/* Simple illustration of a bank building with lock.  In a real app
            you might include an SVG or image here. */}
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-8 border-4 border-yellow-400 rounded-t-lg"></div>
            <div className="w-8 h-5 border-4 border-blue-400 rounded-b-lg"></div>
          </div>
        </div>
      </div>
      <p className="text-center mb-6">
        By clicking Next, you’ll be securely redirected to{' '}
        <span className="font-semibold">{bank?.name}</span>.
      </p>
      <button
        onClick={onConnect}
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium flex justify-center items-center hover:bg-orange-700 focus:outline-none disabled:opacity-60"
      >
        {loading ? 'Connecting…' : 'Next'}
      </button>
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message.text}
        </div>
      )}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Recent Events</h3>
        <div className="max-h-40 overflow-y-auto bg-gray-900 text-white p-2 rounded-lg text-xs">
          {events && events.length > 0 ? (
            events.map((e, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-medium">{e.type || e.msg || e.outcome}</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(e, null, 2)}</pre>
                <div className="border-b border-gray-700 my-1"></div>
              </div>
            ))
          ) : (
            <div>No events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;