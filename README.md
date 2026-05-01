# RouteSense — AI-Powered Logistics Optimization

RouteSense is a resilient logistics platform that uses real-time simulation and Google Gemini AI to monitor global shipments, detect disruptions, and suggest optimized rerouting strategies.

## Key Features
- **Real-Time Monitoring**: Live tracking of shipments with instant status updates via Server-Sent Events (SSE).
- **AI Disruption Analysis**: Automated risk assessment and mitigation advice powered by **Google Gemini 2.0 Flash**.
- **Dynamic Rerouting**: Intelligent evaluation of alternative routes based on cost, speed, and reliability.
- **Live Alert Feed**: Real-time broadcasting of weather, port congestion, and mechanical issues.
- **Performance Analytics**: Interactive dashboards with KPIs like On-Time Rate and Regional Delays.

## Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite, Pydantic.
- **AI**: Google Generative AI (Gemini API).

## Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Additional Details & Future Development

RouteSense is designed as a modular foundation for modern logistics. Future iterations will focus on expanding the platform's intelligence and reach:

### 1. Multi-modal Supply Chain Integration
Extend tracking capabilities beyond maritime shipping to include **air freight, rail networks, and last-mile trucking**, providing a truly global end-to-end visibility solution.

### 2. Predictive Risk Modeling
Leverage historical disruption data and machine learning to move from *reactive* to **predictive AI**. This would allow the system to anticipate port congestion or weather delays before they occur, triggering "Pre-emptive Optimization."

### 3. Sustainability & Carbon Tracking
Integrate **ESG (Environmental, Social, and Governance)** metrics into the routing engine. This will allow logistics managers to choose routes not just based on cost and speed, but also on the **lowest carbon footprint**.

### 4. Blockchain-enabled Documentation
Integrate with decentralized ledgers to handle **Smart Bill of Lading (eBL)** and automated insurance claims triggered by AI-detected disruptions.

### 5. Natural Language Interface
Expand the Gemini integration to support **conversational queries** (e.g., "Find the most delayed cargo in the Pacific and suggest an alternative port").
