import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const MAINNET_BETA_API_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_ADDRESS = '4UYjrT5hmMTh9pLFg1Mxh49besnAeCc23qFoZc6WnQkK';
const LAMPORTS_PER_SOL = 1_000_000_000;

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

    // Fetch detailed transaction information for each signature
    const transactions = await Promise.all(data.result.map(async (tx) => {
      const txDetailsResponse = await fetch(MAINNET_BETA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getConfirmedTransaction',
          params: [tx.signature],
        }),
      });

      const txDetails = await txDetailsResponse.json();
      return txDetails.result;
    }));

    const formattedData = transactions.map((tx) => {
      if (!tx || !tx.transaction || !tx.meta) {
        return null;
      }

      const transaction = tx.transaction;
      const meta = tx.meta;
      
      // Assume the first instruction is indicative of the transaction type
      const instruction = transaction.message.instructions[0];

      let type = 'swap_token'; // Default to swap
      if (instruction.programId === '11111111111111111111111111111111') {
        type = 'send_token';
      }

      const amountLamports = meta.postBalances[1] - meta.preBalances[1]; // Placeholder index for token transfer
      const amountSOL = amountLamports / LAMPORTS_PER_SOL;

      return {
        uuid: tx.transaction.signatures[0], // Placeholder UUID
        network: 'Solana',
        fee: meta.fee,
        compute_units_consumed: meta.computeUnitsConsumed, // Placeholder compute units
        timestamp: new Date(tx.blockTime * 1000).toISOString(),
        type: type,
        wallet_address: WALLET_ADDRESS,
        transaction_hash: tx.transaction.signatures[0],
        metadata: {
          amount: amountSOL.toString(), // Convert lamports to SOL
        },
        token: {
          uuid: '429031ba-fd82-4e95-92b2-9da0bf75f184', // Placeholder UUID
          network: 'Solana',
          contract_address: 'So11111111111111111111111111111111111111112', // Placeholder contract address
          name: 'Wrapped SOL',
          symbol: 'SOL',
          decimals: 9,
          display_decimals: 2,
          logo_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        },
        explorer_url: `https://solscan.io/tx/${tx.transaction.signatures[0]}?cluster=mainnet-beta`,
      };
    }).filter(tx => tx !== null); ; // Filter out null transactions

    return res.json({
      status: 'success',
      message: 'Activity retrieved successfully',
      data: formattedData,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
