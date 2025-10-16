# Quantum Pay Demo

This repository contains a simple demonstration of a Pay‑by‑Bank checkout flow.  It uses a React frontend (built with Vite and Tailwind CSS) and an Express backend to simulate the experience of linking your bank account via Mastercard Data Connect.  The demo includes success and failure scenarios so that you can showcase how monitoring tools like Quantum Metric Felix detect upstream errors.

## Features

* **Four‑screen flow** matching a typical Pay‑by‑Bank experience:
  1. **Pay Bill** – displays an amount due and lets the user choose “Pay by bank” or debit/credit card (the card option is disabled in this demo).
  2. **Mastercard Data Connect Intro** – explains how Quantum Pay uses Mastercard Data Connect to link accounts and includes security statements.
  3. **Find Your Bank** – presents a grid of banks.  Some banks are intentionally configured to fail.
  4. **Share Data / Connect** – simulates connecting to the selected bank and displays a log of recent events.  Errors are returned as real HTTP status codes (500/504) to allow monitoring tools to catch them.
* **Backend API** with endpoints to list banks, simulate a connection, and return recent log events.  Events are logged to JSON lines files under `server/logs`.
* **Render‑ready deployment** with a Dockerfile and `render.yaml` so you can deploy the entire stack as a single web service.

## Getting Started Locally

### Prerequisites

* Node.js (version 18 or higher recommended)
* npm

### Installation

Install dependencies for both the server and the client:

```bash
cd server
npm install
cd ../client
npm install
```

### Running the app in development

In one terminal, start the backend:

```bash
cd server
npm start
```

In another terminal, start the frontend with hot reload:

```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxy API requests to the backend on port 8080.  Open that URL in your browser to interact with the demo.

### Building for production

To build the frontend and copy it into the server so that the backend can serve it statically:

```bash
cd client
npm run build
cd ..

# Copy build output into server/client/dist if you want to run without Docker
cp -r client/dist server/client/dist

# Start the server
cd server
npm start
```

Alternatively, you can build and run the Docker image:

```bash
docker build -t quantum-pay-demo .
docker run -p 8080:8080 quantum-pay-demo
```

## Deployment on Render

The repository includes a `Dockerfile` and `render.yaml` so that you can deploy the application as a single web service on [Render](https://render.com/):

1. Push this repository to GitHub (e.g. as `quantum-pay-demo`).
2. On Render, create a new **Web Service**.
3. Choose **Docker** as the environment and connect your GitHub repo.
4. Keep the build and start commands empty (Render will use the Dockerfile).
5. Deploy.  Your app will be available at a URL like `https://quantum-pay-demo.onrender.com`.

## Simulated banks

The backend defines a list of banks in `server/index.js`.  Each bank can specify a `failType`:

| ID                     | Name                  | Behavior          |
|-----------------------|-----------------------|-------------------|
| `partner_bank`         | Partner Bank          | Always returns HTTP 500 |
| `national_timeout_bank`| National Timeout Bank | Simulates a timeout (HTTP 504) |
| `chase`                | Chase                 | Success          |
| `wells_fargo`          | Wells Fargo           | Success          |
| `bank_of_america`      | Bank of America       | Success          |
| `citi`                 | Citi                  | Success          |
| `ally`                 | Ally                  | Success          |
| `capital_one`          | Capital One           | Success          |
| `truist`               | Truist                | Success          |

Select **Partner Bank** or **National Timeout Bank** in the demo to trigger an error.  These errors are logged and returned as real HTTP 5xx responses so that you can demonstrate how monitoring tools detect them.

## License

This project is provided as a demonstration and does not include any warranties.  Feel free to adapt it for your own demos.