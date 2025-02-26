declare class WalletPay  {
  
  constructor(config: object);
  initialize(ctx : object): void;

  /** 
   * Using the wallet's seed generate a new address from the chain's hd path
   **/
  getNewAddress(ctx : object): AddressDetail;

  
  /**
   * query the db for transaction history
   **/
  getTransactions(opts: TxHistoryParams): TxEntry[];

  /**
   * - Fetch balance accross all the addresses of a chain
   * - Fetch balance of a single address
   **/
  getBalance(opts : { token : string }, address? : string ): Balance;

  /**
   * Traverse the hd path and fetch transaction history
   **/
  syncTransactions({ reset: boolean}): void;

  /**
   * pause the current syncing at the current path
   **/
  pauseSync(): void;

  /**
   * Resume sync from last synced path
   **/
  resumeSync(): void;


  /**
   * Fetch all known addresses and their current  balance
   **/
  getFundedTokenAddresses({ token : string }): Record<string, Balance>;

  /** 
   * Send transactions
   **/
  sendTransaction(opts: TransactionParam): Promise<TxEntry>

  /** 
   * check validity of address
   **/
  isValidAddress(address: string): Promise<Boolean>;

  /**
   * Get the curreny fee estimates of blockchain
   **/
  getFeeEstimate(): FeeEstimate;

  /** 
   * Get chain id of the blockchain
   **/
  getChainId(): number
}

/**
 * Create a Key class for all logic related to generating addresses using seed.
 **/
declare class WalletKey {
  constructor(config : { seed : object }): void;
  
  /**
   * Generate an address with the given path
   **/
  addrFromPath(path: string, addrType? : string): AddressDetail
}


/**
 * Extend this class when implementing logic for remote node connections
**/
declare class ConnectionManager {
  constructor(config: object): void;

  /**
   * Implement logic to connect to endpoints.
   * Update status of the connection manager, by using this.setStatus(<status>)
   **/
  connect(): Promise<void>;
  /**
   * Close connection here
   **/
  close(): Promise<void>;

  /** Reconnection logic **/
  reconnect(): Promise<void>
  
}

type Address = string;
type AddressMeta = Record<string, any>; // any object

declare enum TxDirection {
  INCOMING = 0,
  OUTGOING = 1,
  INTERNAL = 2,
}

interface FeeEstimate {
  fast: number,
  slow: number
}

interface TransactionParam {
  address: Address,
  amount : string,
  unit : UnitType,
  fee: number,
  sender?: Address,
  token : string
}

/**
 * Represents a transaction. All blockchains store data in the db in this format.
 **/
declare class  TxEntry {

  /**
   * address sent from. In UTXO based models it could be an array of addresses
   **/
  public from_address: Address | Address[];

  /**
   * address sent to. In UTXO based models it could be an array of addresses

  **/
  public to_address: Address | Address[];

  /**
   * total fees paid 
   **/
  public fee?: number;

  /**
   * amount of units transfered, in Currency
   **/
  public  amount: Currency;

  /**
   * fee rate paid for transaction
   **/
  public  fee_rate: number;

  /**
   * transaction id on the blockchain 
   **/
  public  txid: string;

  /**
   * type of transaction 
   **/
  public  direction: TxDirection;

  /**
   * block height of the tx. zero means its in mempool
   **/
  public  height: number;

  /**
   * currency in string
   **/
  public   currency: string;

  /**
   * meta data about the to_address. example, when sending to 2 addresses, how much each received.
   **/
  public  to_address_meta?: AddressMeta;
}


interface TxHistoryParams {
  limit: number;
  offset: number;
  token: string;
  reverse: boolean;
}

interface AddressDetail {
  address : string;
  publicKey: string;
  privateKey: string;
  path: string
}

/**
 * Represents currency amounts. Extend this 
 **/
declare class  Currency {

  /**
   * name of the currency example, btc
   **/
  public name: string;

  /**
   * name of the base unit, example sats
   **/
  public base_name: string;

  /**
   * decimals of the unit 
   **/
  public decimal_places: number;

  /**
   * Quanity of the currency
   **/
  public amount: string;
}

declare enum UnitType {
  base = 'base',
  main = 'main'
}

interface Balance {
  confirmed: Currency,
  pending: Currency,
  Mempool: Currency
}


