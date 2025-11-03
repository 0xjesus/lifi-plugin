# Li.Fi Data Provider Plugin

A plugin that collects and normalizes market data from the Li.Fi aggregator API for NEAR Intents.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server with web UI
bun dev
```

Open `http://localhost:3001` to test the plugin.

## Testing & Verification

### Run Tests
```bash
# Run all unit and integration tests
bun test
```

### Verify Data Collection
1. Start the dev server: `bun dev`
2. Open the web UI at `http://localhost:3001`
3. Test each endpoint:
   - **Rates & Fees**: Check real-time quotes with fee breakdowns
   - **Liquidity Depth**: Verify liquidity estimates for routes
   - **Available Assets**: Confirm supported chains and tokens load
   - **Volume Data**: Validate 24h, 7d, and 30d volume metrics

Expected behavior: All endpoints should return valid data without errors.

## Data Sources

| Metric | Source | Endpoint |
| :--- | :--- | :--- |
| **Rates & Fees** | Li.Fi API | `GET /quote` |
| **Liquidity Depth** | Li.Fi API | `GET /quote` (probe) |
| **Available Assets** | Li.Fi API | `GET /chains` & `GET /tokens` |
| **Volume** | DefiLlama API | `GET /bridge/lifi` |

## Configuration (Optional)

Environment variables in `.env` (all optional with defaults):

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `LIFI_BASE_URL` | Li.Fi API base URL | `https://li.fi/api` |
| `LIFI_API_KEY` | API key for higher rate limits | `not-required` |
| `LIFI_TIMEOUT` | Request timeout (ms) | `15000` |

## Features

- **Automatic Retries**: Exponential backoff for transient failures
- **Rate Limiting**: Token bucket algorithm prevents API throttling
- **Dual Sources**: Li.Fi API + DefiLlama for complete data coverage

## Resources

- [Li.Fi Website](https://li.fi/)
- [Li.Fi API Docs](https://apidocs.li.fi/)