import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const MAINNET_BETA_API_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_ADDRESS = '4UYjrT5hmMTh9pLFg1Mxh49besnAeCc23qFoZc6WnQkK';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/transactions', async (req, res) => {
  try {
    const response = await fetch(MAINNET_BETA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          WALLET_ADDRESS,
          { limit: 50 }, // Adjust limit as needed
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ status: 'error', message: data.error.message });
    }

    // Transform the data to the desired format
    const formattedData = data.result.map(tx => ({
      uuid: tx.signature, // Placeholder UUID
      network: 'Solana',
      fee: 5000, // Placeholder fee
      compute_units_consumed: 150, // Placeholder compute units
      timestamp: new Date(tx.blockTime * 1000).toISOString(),
      type: 'send_token', // Placeholder type
      wallet_address: WALLET_ADDRESS,
      transaction_hash: tx.signature,
      metadata: {
        amount: '13543773' // Placeholder amount
      },
      token: {
        uuid: '429031ba-fd82-4e95-92b2-9da0bf75f184', // Placeholder UUID
        network: 'Solana',
        contract_address: 'So11111111111111111111111111111111111111112', // Placeholder contract address
        name: 'Wrapped SOL',
        symbol: 'SOL',
        decimals: 9,
        display_decimals: 2,
        logo_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      },
      explorer_url: `https://solscan.io/tx/${tx.signature}?cluster=mainnet-beta`
    }));

    return res.json({
      status: 'success',
      message: 'Activity retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
