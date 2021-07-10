import { Authorized, clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, StakeProgram } from '@solana/web3.js';
import fs from 'fs';

const STAKE_PROGRAM_ID = new PublicKey('Stake11111111111111111111111111111111111111');

const PRIVATE_KEY = Buffer.from(JSON.parse(fs.readFileSync('test.json', 'utf8')));
const KEYPAIR = Keypair.fromSecretKey(PRIVATE_KEY);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const RPC_POOL_ENDPOINT = ''
const ENDPOINT = clusterApiUrl('devnet');
const connection = new Connection(ENDPOINT, 'confirmed');

async function main() {
  const rentExemptRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

  connection.onProgramAccountChange(STAKE_PROGRAM_ID, ({accountId, accountInfo}) => {
    console.log(`received ${accountInfo.lamports - rentExemptRent} ${accountId.toBase58()}`);
  },
  'confirmed',
  [
    {
      memcmp: {
        offset: 12,
        bytes: KEYPAIR.publicKey.toBase58()
      }
    }
  ]);
  let index = 1;
  while (1) {
    const newKeypair = new Keypair();
    const lamports = rentExemptRent + index;

    const transaction = StakeProgram.createAccount({
      fromPubkey: KEYPAIR.publicKey,
      stakePubkey: newKeypair.publicKey,
      authorized: new Authorized(
        KEYPAIR.publicKey,
        KEYPAIR.publicKey
      ),
      lamports
    });
    transaction.feePayer = KEYPAIR.publicKey;
    //let recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    //console.log(recentBlockhash);
    //transaction.recentBlockhash = recentBlockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [KEYPAIR, newKeypair],
    );
    console.log(`Sent ${index}`);

    await sleep(1000);
    index++;
  }
}
main();